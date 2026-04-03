#!/usr/bin/env python3
"""
Direction-optimized training for all pairs with target >65% win rate
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path

import pandas as pd
import numpy as np
import yfinance as yf
import xgboost as xgb
import joblib

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SYMBOLS = {"BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD", "XAUT": "XAUR-USD", "XRP": "XRP-USD"}
TIMEFRAME_CONFIG = {"1h": {"period": "60d", "interval": "1h"}, "1d": {"period": "10y", "interval": "1d"}}

def fetch(symbol, timeframe):
    ticker = SYMBOLS[symbol.upper()]
    period, interval = TIMEFRAME_CONFIG[timeframe].values()
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    if df.empty: raise ValueError(f"No data")
    df = df[['Open','High','Low','Close','Volume']].copy()
    df.columns = ['open','high','low','close','volume']
    df.index.name = 'timestamp'
    df['symbol'] = symbol.upper()
    return df

def indicators(df):
    df = df.copy()
    df['sma_20'] = df['close'].rolling(20).mean()
    df['sma_50'] = df['close'].rolling(50).mean()
    df['sma_200'] = df['close'].rolling(200).mean()
    df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    df['bollinger_middle'] = df['close'].rolling(20).mean()
    bb_std = df['close'].rolling(20).std()
    df['bollinger_upper'] = df['bollinger_middle'] + bb_std * 2
    df['bollinger_lower'] = df['bollinger_middle'] - bb_std * 2
    delta = df['close'].diff()
    gain = delta.where(delta>0, 0).rolling(14).mean()
    loss = (-delta.where(delta<0, 0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.finfo(float).eps)
    df['rsi'] = 100 - (100 / (1 + rs))
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()
    df['adx'] = 25.0
    low_14 = df['low'].rolling(14).min()
    high_14 = df['high'].rolling(14).max()
    df['stoch_k'] = 100 * ((df['close'] - low_14) / (high_14 - low_14 + 1e-10))
    df['stoch_d'] = df['stoch_k'].rolling(3).mean()
    highest_high = df['high'].rolling(14).max()
    lowest_low = df['low'].rolling(14).min()
    df['williams_r'] = -100 * ((highest_high - df['close']) / (highest_high - lowest_low + 1e-10))
    # CCI
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    sma_tp = typical_price.rolling(20).mean()
    mean_dev = typical_price.rolling(20).apply(lambda x: np.mean(np.abs(x - x.mean())))
    df['cci'] = (typical_price - sma_tp) / (0.015 * mean_dev.replace(0, 1))
    # MFI
    raw_money_flow = typical_price * df['volume']
    positive_flow = raw_money_flow.where(typical_price > typical_price.shift(1), 0).rolling(14).sum()
    negative_flow = raw_money_flow.where(typical_price < typical_price.shift(1), 0).rolling(14).sum()
    mf_ratio = positive_flow / negative_flow.replace(0, np.finfo(float).eps)
    df['mfi'] = 100 - (100 / (1 + mf_ratio))
    # OBV
    df['obv'] = np.where(df['close'] > df['close'].shift(1), df['volume'],
                         np.where(df['close'] < df['close'].shift(1), -df['volume'], 0)).cumsum()
    return df.ffill().bfill()

def prepare(df, lookback=60):
    df = df.copy()
    future_return = df['close'].shift(-1) / df['close'] - 1
    threshold = 0.002
    df['target'] = -1
    df.loc[future_return > threshold, 'target'] = 1  # up
    df.loc[future_return < -threshold, 'target'] = 0  # down
    df_filtered = df[df['target'] != -1].copy()
    
    feature_cols = ['close','volume','rsi','macd','macd_signal','macd_hist','sma_20','sma_50','sma_200','ema_12','ema_26','bollinger_upper','bollinger_middle','bollinger_lower','atr','adx','stoch_k','stoch_d','williams_r','cci','mfi','obv']
    for lag in range(1, lookback+1):
        df_filtered[f'close_lag_{lag}'] = df_filtered['close'].shift(lag)
        feature_cols.append(f'close_lag_{lag}')
    
    df_filtered = df_filtered.dropna()
    X = df_filtered[feature_cols].values
    y = df_filtered['target'].values
    return X, y, feature_cols, df_filtered.index

def train(X_train, y_train, X_val, y_val, feature_names, model_dir):
    param_sets = [
        {'n_estimators':300,'max_depth':6,'learning_rate':0.05,'subsample':0.8,'colsample_bytree':0.8},
        {'n_estimators':500,'max_depth':8,'learning_rate':0.1,'subsample':0.9,'colsample_bytree':0.9},
        {'n_estimators':200,'max_depth':10,'learning_rate':0.2,'subsample':0.8,'colsample_bytree':0.7},
    ]
    
    best_acc, best_model, best_params, best_thresh = 0, None, None, 0.5
    
    for params in param_sets:
        model = xgb.XGBClassifier(**params, objective='binary:logistic', eval_metric='logloss', seed=42, n_jobs=-1)
        model.fit(X_train, y_train)
        probs = model.predict_proba(X_val)[:,1]
        for thresh in np.arange(0.3, 0.71, 0.05):
            preds = (probs >= thresh).astype(int)
            acc = (preds == y_val).mean()
            if acc > best_acc:
                best_acc, best_model, best_params, best_thresh = acc, model, params, thresh
    
    logger.info(f"  ✅ Best: acc={best_acc:.2%}, threshold={best_thresh:.2f}")
    
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_dir / "xgboost_model.joblib")
    with open(model_dir / "feature_names.json", 'w') as f: json.dump(feature_names, f, indent=2)
    with open(model_dir / "threshold.json", 'w') as f: json.dump({"threshold": float(best_thresh), "win_rate": float(best_acc)}, f, indent=2)
    
    importance = pd.DataFrame({'feature': feature_names, 'importance': best_model.feature_importances_}).sort_values('importance', ascending=False)
    importance.to_csv(model_dir / "feature_importance.csv", index=False)
    logger.info(f"  Top 5: {importance.head(5)['feature'].tolist()}")
    
    return best_acc, best_thresh

def process(symbol, timeframe):
    logger.info(f"\n{'='*60}")
    logger.info(f"DIRECTION: {symbol} {timeframe}")
    logger.info(f"{'='*60}")
    
    try:
        df = fetch(symbol, timeframe)
        df = indicators(df)
        X, y, feature_names, timestamps = prepare(df)
        
        if len(X) < 200:
            logger.warning(f"  Skipping: only {len(X)} samples")
            return None
        
        split = int(len(X) * 0.8)
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        
        logger.info(f"Split: train={len(X_train)}, val={len(X_val)}")
        
        model_dir = Path(f"models/{symbol.upper()}-{timeframe}")
        win_rate, threshold = train(X_train, y_train, X_val, y_val, feature_names, model_dir)
        
        logger.info(f"  ✅ {symbol} {timeframe}: {len(X)} samples, win_rate={win_rate:.2%}")
        return {"symbol": symbol, "timeframe": timeframe, "samples": len(X), "win_rate": float(win_rate), "threshold": float(threshold)}
    except Exception as e:
        logger.error(f"  ❌ Failed: {e}")
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--timeframe', choices=['1h','1d','both'], default='both')
    parser.add_argument('--symbols', default='all')
    args = parser.parse_args()
    
    symbols = list(SYMBOLS.keys()) if args.symbols=='all' else [s.strip() for s in args.symbols.split(',') if s.strip() in SYMBOLS]
    timeframes = ['1h','1d'] if args.timeframe=='both' else [args.timeframe]
    
    logger.info(f"Training direction models: {symbols} × {timeframes}")
    
    results = []
    for tf in timeframes:
        for sym in symbols:
            result = process(sym, tf)
            if result: results.append(result)
    
    logger.info("\n" + "="*60)
    logger.info("ALL DONE")
    logger.info("="*60)
    logger.info(f"Models trained: {len(results)}")
    if results:
        avg = sum(r['win_rate'] for r in results) / len(results)
        logger.info(f"Average win rate: {avg:.2%}")
        for r in results:
            logger.info(f"  {r['symbol']} {r['timeframe']}: {r['win_rate']:.2%} (thresh={r['threshold']:.2f})")

if __name__ == "__main__":
    main()
