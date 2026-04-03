#!/usr/bin/env python3
"""
Full pipeline: Fetch data from Yahoo Finance and train models for all symbols
Usage: python scripts/train_all_pairs.py [--timeframe 1h|1d] [--period 60d|5y]
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np
import yfinance as yf
import xgboost as xgb
import joblib

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# All symbols to train
SYMBOLS = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "XAUT": "XAUR-USD",
    "XRP": "XRP-USD",
}

TIMEFRAME_CONFIG = {
    "1h": {"period": "60d", "interval": "1h"},  # yfinance max ~60 days hourly
    "1d": {"period": "10y", "interval": "1d"},   # 10 years daily for longer cycles
}

def fetch_yfinance(symbol: str, timeframe: str) -> pd.DataFrame:
    """Fetch OHLC from yfinance for a single symbol"""
    ticker = SYMBOLS[symbol.upper()]
    period, interval = TIMEFRAME_CONFIG[timeframe].values()
    
    logger.info(f"Fetching {symbol} ({ticker}) - {timeframe} - {period}")
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    
    if df.empty:
        raise ValueError(f"No data for {ticker}")
    
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    df.columns = ['open', 'high', 'low', 'close', 'volume']
    df.index.name = 'timestamp'
    df['symbol'] = symbol.upper()
    
    logger.info(f"  Fetched {len(df)} rows, range: {df.index[0]} to {df.index[-1]}")
    return df

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators"""
    df = df.copy()
    
    # SMAs
    df['sma_20'] = df['close'].rolling(20).mean()
    df['sma_50'] = df['close'].rolling(50).mean()
    df['sma_200'] = df['close'].rolling(200).mean()
    
    # EMAs
    df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
    
    # MACD
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    
    # Bollinger Bands
    df['bollinger_middle'] = df['close'].rolling(20).mean()
    bb_std = df['close'].rolling(20).std()
    df['bollinger_upper'] = df['bollinger_middle'] + (bb_std * 2)
    df['bollinger_lower'] = df['bollinger_middle'] - (bb_std * 2)
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.finfo(float).eps)
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # ATR
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()
    
    df['adx'] = 25.0  # placeholder
    
    # Stochastic
    low_14 = df['low'].rolling(14).min()
    high_14 = df['high'].rolling(14).max()
    df['stoch_k'] = 100 * ((df['close'] - low_14) / (high_14 - low_14 + 1e-10))
    df['stoch_d'] = df['stoch_k'].rolling(3).mean()
    
    # Williams %R
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
    
    df = df.ffill().bfill()
    return df

def prepare_features(df: pd.DataFrame, lookback: int = 60):
    """Prepare X and y"""
    df = df.copy()
    
    # Target: multi-class (0=hold, 1=buy, 2=sell)
    future_return = df['close'].shift(-1) / df['close'] - 1
    threshold = 0.002
    df['target'] = 0
    df.loc[future_return > threshold, 'target'] = 1
    df.loc[future_return < -threshold, 'target'] = 2
    
    feature_cols = [
        'close', 'volume', 'rsi', 'macd', 'macd_signal', 'macd_hist',
        'sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26',
        'bollinger_upper', 'bollinger_middle', 'bollinger_lower',
        'atr', 'adx', 'stoch_k', 'stoch_d', 'williams_r', 'cci', 'mfi', 'obv'
    ]
    
    for lag in range(1, lookback + 1):
        df[f'close_lag_{lag}'] = df['close'].shift(lag)
        feature_cols.append(f'close_lag_{lag}')
    
    df = df.dropna()
    X = df[feature_cols].values
    y = df['target'].values
    
    logger.info(f"  Prepared: {len(X)} samples, {len(feature_cols)} features")
    logger.info(f"  Class dist: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_cols, df.index[-len(X):]

def train_xgboost(X_train, y_train, X_val, y_val, feature_names, model_dir: Path):
    """Train XGBoost model"""
    logger.info("  Training XGBoost...")
    
    params = {
        'n_estimators': 200,
        'max_depth': 6,
        'learning_rate': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'objective': 'multi:softprob',
        'num_class': 3,
        'eval_metric': 'mlogloss',
        'seed': 42,
        'n_jobs': -1,
    }
    
    model = xgb.XGBClassifier(**params)
    model.fit(X_train, y_train)
    
    # Save
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_dir / "xgboost_model.joblib")
    
    # Feature names
    with open(model_dir / "feature_names.json", 'w') as f:
        json.dump(feature_names, f, indent=2)
    
    # Feature importance
    importance = model.feature_importances_
    feat_imp = pd.DataFrame({'feature': feature_names, 'importance': importance})
    feat_imp = feat_imp.sort_values('importance', ascending=False)
    feat_imp.to_csv(model_dir / "feature_importance.csv", index=False)
    
    # Metrics
    train_acc = (model.predict(X_train) == y_train).mean()
    val_acc = (model.predict(X_val) == y_val).mean()
    
    logger.info(f"  ✓ Train acc: {train_acc:.2%} | Val acc: {val_acc:.2%}")
    
    return model, val_acc

def process_symbol(symbol: str, timeframe: str):
    """Full pipeline for one symbol/timeframe"""
    logger.info(f"\n{'='*60}")
    logger.info(f"PROCESSING {symbol} - {timeframe}")
    logger.info(f"{'='*60}")
    
    try:
        # 1. Fetch
        df = fetch_yfinance(symbol, timeframe)
        
        # 2. Indicators
        df = calculate_indicators(df)
        
        # 3. Features
        X, y, feature_cols, timestamps = prepare_features(df)
        
        if len(X) < 100:
            logger.warning(f"  Skipping: only {len(X)} samples (need >=100)")
            return None
        
        # 4. Save CSV (optional, for record)
        csv_dir = Path("data/per_symbol")
        csv_dir.mkdir(parents=True, exist_ok=True)
        csv_path = csv_dir / f"{symbol.upper()}_{timeframe}_train.csv"
        output_df = pd.DataFrame(X, columns=feature_cols)
        output_df['target'] = y
        output_df.index = timestamps
        output_df.to_csv(csv_path, index=True)
        logger.info(f"  CSV saved: {csv_path}")
        
        # 5. Train/val split
        split = int(len(X) * 0.8)
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        
        # 6. Train
        model_dir = Path(f"models/{symbol.upper()}-{timeframe}")
        model, val_acc = train_xgboost(X_train, y_train, X_val, y_val, feature_cols, model_dir)
        
        logger.info(f"  ✅ {symbol} {timeframe} model saved to {model_dir}")
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "samples": len(X),
            "val_accuracy": float(val_acc),
            "model_dir": str(model_dir),
        }
        
    except Exception as e:
        logger.error(f"  ❌ Failed: {e}", exc_info=True)
        return None

def main():
    parser = argparse.ArgumentParser(description='Train all pairs')
    parser.add_argument('--timeframe', choices=['1h', '1d', 'both'], default='both', help='Timeframe to train')
    parser.add_argument('--symbols', default='all', help='Comma-separated symbols (default: all)')
    
    args = parser.parse_args()
    
    # Determine symbols
    if args.symbols == 'all':
        symbols = list(SYMBOLS.keys())
    else:
        symbols = [s.strip() for s in args.symbols.split(',') if s.strip() in SYMBOLS]
    
    # Determine timeframes
    timeframes = ['1h', '1d'] if args.timeframe == 'both' else [args.timeframe]
    
    logger.info(f"Starting training for {len(symbols)} symbols, {len(timeframes)} timeframes each")
    logger.info(f"Symbols: {symbols}")
    logger.info(f"Timeframes: {timeframes}")
    
    results = []
    for tf in timeframes:
        for sym in symbols:
            result = process_symbol(sym, tf)
            if result:
                results.append(result)
    
    # Summary
    logger.info(f"\n{'='*60}")
    logger.info("TRAINING COMPLETE")
    logger.info(f"{'='*60}")
    logger.info(f"Total models trained: {len(results)}")
    
    if results:
        avg_val_acc = sum(r['val_accuracy'] for r in results) / len(results)
        logger.info(f"Average validation accuracy: {avg_val_acc:.2%}")
        logger.info("\nModels:")
        for r in results:
            logger.info(f"  {r['symbol']} {r['timeframe']}: {r['samples']} samples, val_acc={r['val_accuracy']:.2%}")
    
    logger.info("\nNext steps:")
    logger.info("  1. Test: python scripts/inference_from_model.py BTC 1h")
    logger.info("  2. Commit & push model files to Vercel")
    logger.info("  3. Test API: POST /api/quant-ai/predict")

if __name__ == "__main__":
    main()
