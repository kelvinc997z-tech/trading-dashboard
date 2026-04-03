#!/usr/bin/env python3
"""
Advanced training with on-chain features from CryptoQuant
Goal: Achieve >60% win rate by augmenting OHLC with blockchain metrics
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta

import pandas as pd
import numpy as np
import yfinance as yf
import xgboost as xgb
import joblib
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# CryptoQuant API
CRYPTOQUANT_API_KEY = os.getenv('CRYPTOQUANT_API_KEY')
if not CRYPTOQUANT_API_KEY:
    logger.warning("CRYPTOQUANT_API_KEY not set - on-chain features will be mocked/zero")

CRYPTOQUANT_BASE = "https://api.cryptoquant.com/live/v3"

# Mapping simbol CryptoQuant
CQ_SYMBOLS = {
    "BTC": "btc",
    "ETH": "eth",
    "SOL": "sol",
    "XRP": "xrp",
}

# On-chain metrics yang akan di-fetch
ONCHAIN_METRICS = [
    "exchange_inflows",      # Exchange inflow volume (USD)
    "exchange_outflows",     # Exchange outflow volume (USD)
    "exchange_balance",      # Exchange balance (asset)
    "whale_exchange_supply_ratio",  # % supply on exchanges held by whales
    "miner_outflows",        # Miner outflow volume
    "transaction_count",     # Transaction count
    "active_addresses",      # Active addresses
    "funding_rates",         # Perpetual funding rates
    "open_interest",         # Open interest (USD)
]

def fetch_cryptoquant_metric(symbol: str, metric: str, limit: int = 365) -> pd.DataFrame:
    """Fetch on-chain metric dari CryptoQuant API"""
    if not CRYPTOQUANT_API_KEY:
        # Return empty df if no API key
        return pd.DataFrame()
    
    try:
        # Build endpoint (simplified -的实际 endpoints may vary)
        endpoint_map = {
            "exchange_inflows": f"c/exchange-flows/inflow?asset={CQ_SYMBOLS[symbol]}&exchange=all&window=DAY",
            "exchange_outflows": f"c/exchange-flows/outflow?asset={CQ_SYMBOLS[symbol]}&exchange=all&window=DAY",
            "exchange_balance": f"c/exchange-assets?asset={CQ_SYMBOLS[symbol]}&exchange=all",
            "whale_exchange_supply_ratio": f"c/distribution/percentage-of-supply?asset={CQ_SYMBOLS[symbol]}&wallet=all&min_value=10000",
            "miner_outflows": f"c/miner-flows/outflow?asset={CQ_SYMBOLS[symbol]}&miners=all",
            "transaction_count": f"c/network-data/transaction-count?asset={CQ_SYMBOLS[symbol]}",
            "active_addresses": f"c/network-data/addresses-count?asset={CQ_SYMBOLS[symbol]}",
            "funding_rates": f"c/derivatives/funding-rates?asset={CQ_SYMBOLS[symbol]}&exchange=all",
            "open_interest": f"c/derivatives/open-interest?asset={CQ_SYMBOLS[symbol]}&exchange=all",
        }
        
        endpoint = endpoint_map.get(metric)
        if not endpoint:
            logger.warning(f"Unknown metric: {metric}")
            return pd.DataFrame()
        
        url = f"{CRYPTOQUANT_BASE}/{endpoint}&limit={limit}"
        res = requests.get(url, headers={"Authorization": f"Bearer {CRYPTOQUANT_API_KEY}"}, timeout=10)
        
        if res.status_code != 200:
            logger.warning(f"CryptoQuant {metric} failed: {res.status_code}")
            return pd.DataFrame()
        
        data = res.json()
        # Parse CryptoQuant response (结构 sẽ thay đổi)
        # Expected: list of {timestamp, value}
        records = []
        for item in data.get('data', []):
            records.append({
                'timestamp': pd.to_datetime(item['timestamp'], unit='ms'),
                metric: float(item['value'])
            })
        
        df = pd.DataFrame(records).set_index('timestamp')
        return df
        
    except Exception as e:
        logger.error(f"Error fetching {metric}: {e}")
        return pd.DataFrame()

def fetch_yfinance_ohlc(symbol: str, timeframe: str = "1d", period: str = "5y") -> pd.DataFrame:
    """Fetch OHLC dari yfinance"""
    ticker_map = {
        "BTC": "BTC-USD",
        "ETH": "ETH-USD", 
        "SOL": "SOL-USD",
        "XAUT": "XAUR-USD",
        "XRP": "XRP-USD",
    }
    ticker = ticker_map[symbol.upper()]
    
    logger.info(f"Fetching {symbol} OHLC from yfinance ({period})...")
    df = yf.download(ticker, period=period, interval=timeframe, progress=False)
    
    if df.empty:
        raise ValueError(f"No OHLC data for {ticker}")
    
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    df.columns = ['open', 'high', 'low', 'close', 'volume']
    df.index.name = 'timestamp'
    return df

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate all technical indicators"""
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
    df['bollinger_upper'] = df['bollinger_middle'] + bb_std * 2
    df['bollinger_lower'] = df['bollinger_middle'] - bb_std * 2
    
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

def add_onchain_features(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    """Fetch and merge on-chain metrics into OHLC dataframe"""
    df = df.copy()
    
    all_metrics = []
    for metric in ONCHAIN_METRICS:
        logger.info(f"  Fetching on-chain: {metric}...")
        metric_df = fetch_cryptoquant_metric(symbol, metric, limit=len(df)+10)
        
        if metric_df.empty:
            # If API fails, fill with zeros (or forward-fill later)
            df[metric] = 0.0
            logger.warning(f"    -> No data for {metric}, using zero")
        else:
            # Reindex to match OHLC dates, forward fill
            metric_df = metric_df.reindex(df.index, method='ffill')
            df[metric] = metric_df[metric].fillna(0)
        
        all_metrics.append(metric)
    
    logger.info(f"  Added {len(all_metrics)} on-chain features")
    return df

def prepare_training_data(df: pd.DataFrame, lookback: int = 60):
    """Prepare X, y for binary direction classification"""
    df = df.copy()
    
    # Binary target: up (1) vs down (0), exclude holds
    future_return = df['close'].shift(-1) / df['close'] - 1
    threshold = 0.002
    df['target'] = -1
    df.loc[future_return > threshold, 'target'] = 1
    df.loc[future_return < -threshold, 'target'] = 0
    
    df_filtered = df[df['target'] != -1].copy()
    
    # Feature columns: all numeric except target
    exclude = ['target', 'symbol'] if 'symbol' in df.columns else ['target']
    base_features = [
        'close', 'volume', 'rsi', 'macd', 'macd_signal', 'macd_hist',
        'sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26',
        'bollinger_upper', 'bollinger_middle', 'bollinger_lower',
        'atr', 'adx', 'stoch_k', 'stoch_d', 'williams_r', 'cci', 'mfi', 'obv'
    ]
    
    # Add on-chain metrics
    onchain_features = [m for m in ONCHAIN_METRICS if m in df.columns]
    feature_cols = base_features + onchain_features
    
    # Add lagged closes
    for lag in range(1, lookback + 1):
        df_filtered[f'close_lag_{lag}'] = df_filtered['close'].shift(lag)
        feature_cols.append(f'close_lag_{lag}')
    
    df_filtered = df_filtered.dropna()
    X = df_filtered[feature_cols].values
    y = df_filtered['target'].values
    
    logger.info(f"  Dataset: {len(X)} samples, {len(feature_cols)} features ({len(onchain_features)} on-chain)")
    logger.info(f"  Class balance: Up={sum(y==1)}, Down={sum(y==0)}")
    
    return X, y, feature_cols, df_filtered.index

def train_with_optimization(X_train, y_train, X_val, y_val, feature_names, model_dir: Path):
    """Train XGBoost with hyperparameter tuning and threshold optimization"""
    logger.info("  Training with optimization...")
    
    param_sets = [
        {'n_estimators': 300, 'max_depth': 6, 'learning_rate': 0.05, 'subsample': 0.8, 'colsample_bytree': 0.8},
        {'n_estimators': 500, 'max_depth': 8, 'learning_rate': 0.1, 'subsample': 0.9, 'colsample_bytree': 0.9},
        {'n_estimators': 200, 'max_depth': 10, 'learning_rate': 0.2, 'subsample': 0.8, 'colsample_bytree': 0.7},
    ]
    
    best_acc, best_model, best_params, best_thresh = 0, None, None, 0.5
    
    for params in param_sets:
        model = xgb.XGBClassifier(
            **params,
            objective='binary:logistic',
            eval_metric='logloss',
            seed=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        probs = model.predict_proba(X_val)[:, 1]
        for thresh in np.arange(0.3, 0.71, 0.05):
            preds = (probs >= thresh).astype(int)
            acc = (preds == y_val).mean()
            if acc > best_acc:
                best_acc, best_model, best_params, best_thresh = acc, model, params, thresh
    
    logger.info(f"  ✅ Best val acc: {best_acc:.2%}, threshold={best_thresh:.2f}")
    
    # Save
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_dir / "xgboost_model.joblib")
    with open(model_dir / "feature_names.json", 'w') as f:
        json.dump(feature_names, f, indent=2)
    with open(model_dir / "threshold.json", 'w') as f:
        json.dump({"threshold": float(best_thresh), "win_rate": float(best_acc)}, f, indent=2)
    
    # Feature importance
    importance = pd.DataFrame({
        'feature': feature_names,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    importance.to_csv(model_dir / "feature_importance.csv", index=False)
    
    logger.info(f"  Top 5 features: {importance.head(5)['feature'].tolist()}")
    
    return best_acc, best_thresh

def process_symbol_with_onchain(symbol: str, timeframe: str = "1d", period: str = "5y"):
    """Full pipeline: fetch OHLC + on-chain, train direction model"""
    logger.info(f"\n{'='*60}")
    logger.info(f"ON-CHAIN TRAINING: {symbol} {timeframe}")
    logger.info(f"{'='*60}")
    
    try:
        # 1. Fetch OHLC
        df_ohlc = fetch_yfinance_ohlc(symbol, timeframe, period)
        logger.info(f"  OHLC rows: {len(df_ohlc)}")
        
        # 2. Calculate technical indicators
        df_indicators = calculate_indicators(df_ohlc)
        
        # 3. Add on-chain features (if API key available)
        if CRYPTOQUANT_API_KEY:
            df_with_onchain = add_onchain_features(df_indicators, symbol)
        else:
            logger.warning("  ⚠️ CRYPTOQUANT_API_KEY not set - skipping on-chain features")
            df_with_onchain = df_indicators
        
        # 4. Prepare training data
        X, y, feature_names, timestamps = prepare_training_data(df_with_onchain)
        
        if len(X) < 200:
            logger.warning(f"  Skipping: only {len(X)} samples")
            return None
        
        # 5. Split
        split = int(len(X) * 0.8)
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        
        logger.info(f"  Split: train={len(X_train)}, val={len(X_val)}")
        
        # 6. Train
        model_dir = Path(f"models/{symbol.upper()}-{timeframe}")
        win_rate, threshold = train_with_optimization(
            X_train, y_train, X_val, y_val, feature_names, model_dir
        )
        
        logger.info(f"  ✅ {symbol} {timeframe}: {len(X)} samples, win_rate={win_rate:.2%}")
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "samples": len(X),
            "win_rate": float(win_rate),
            "threshold": float(threshold),
        }
        
    except Exception as e:
        logger.error(f"  ❌ Failed: {e}", exc_info=True)
        return None

def main():
    parser = argparse.ArgumentParser(description='Train with on-chain features')
    parser.add_argument('--symbols', default='BTC,ETH,SOL,XRP', help='Comma-separated')
    parser.add_argument('--timeframe', default='1d', choices=['1d', '1h'])
    parser.add_argument('--period', default='5y', help='OHLC period (e.g., 5y, 10y)')
    
    args = parser.parse_args()
    
    symbols = [s.strip() for s in args.symbols.split(',')]
    
    logger.info(f"On-chain training for {symbols} ({args.timeframe}, {args.period})")
    
    results = []
    for symbol in symbols:
        result = process_symbol_with_onchain(symbol, args.timeframe, args.period)
        if result:
            results.append(result)
    
    logger.info("\n" + "="*60)
    logger.info("TRAINING COMPLETE")
    logger.info("="*60)
    logger.info(f"Models: {len(results)}")
    if results:
        avg = sum(r['win_rate'] for r in results) / len(results)
        logger.info(f"Average win rate: {avg:.2%}")
        for r in results:
            logger.info(f"  {r['symbol']}: {r['win_rate']:.2%} ({r['samples']} samples)")

if __name__ == "__main__":
    main()
