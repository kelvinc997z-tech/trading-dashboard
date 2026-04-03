#!/usr/bin/env python3
"""
Fetch OHLC data from CoinGecko for multiple symbols and combine for training
Output: data/COMBINED_1h_train.csv (features + target)
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
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COINGECKO_ID_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "XAUT": "tether-gold",
}

def fetch_coingecko_ohlc(symbol: str, timeframe: str = "1h") -> pd.DataFrame:
    """Fetch OHLC from CoinGecko. Returns DataFrame with timestamp index."""
    coin_id = COINGECKO_ID_MAP[symbol.upper()]
    vs_currency = "usd"

    if timeframe == "1h":
        days_needed = 30  # max hourly data
    elif timeframe == "1d":
        days_needed = 90
    else:
        raise ValueError(f"Unsupported: {timeframe}")

    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc"
    params = {"vs_currency": vs_currency, "days": str(days_needed)}
    
    logger.info(f"Fetching {symbol} ({coin_id}) {timeframe}...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    
    df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    df = df.sort_index()
    df['volume'] = 0.0  # placeholder
    df['symbol'] = symbol.upper()
    
    logger.info(f"  → {len(df)} rows, range: {df.index[0]} to {df.index[-1]}")
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
    
    # ADX placeholder
    df['adx'] = 25.0
    
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
    """Prepare feature matrix X and target y"""
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
    
    # Add lagged closes
    for lag in range(1, lookback + 1):
        df[f'close_lag_{lag}'] = df['close'].shift(lag)
        feature_cols.append(f'close_lag_{lag}')
    
    df = df.dropna()
    X = df[feature_cols].values
    y = df['target'].values
    
    logger.info(f"Prepared: {len(X)} samples, {len(feature_cols)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_cols, df.index[-len(X):]

def main():
    parser = argparse.ArgumentParser(description='Fetch and prepare combined dataset from CoinGecko')
    parser.add_argument('--timeframe', default='1h', choices=['1h', '1d'], help='Timeframe to fetch')
    parser.add_argument('--output', default='data/COMBINED_1h_train.csv', help='Output CSV path')
    parser.add_argument('--symbols', default='BTC,ETH,SOL,XAUT', help='Comma-separated symbols')
    
    args = parser.parse_args()
    symbols = [s.strip() for s in args.symbols.split(',')]
    
    try:
        all_X, all_y, all_feature_names = [], [], None
        all_timestamps = []
        
        for symbol in symbols:
            if symbol not in COINGECKO_ID_MAP:
                logger.warning(f"Skipping {symbol}: not in map")
                continue
            df = fetch_coingecko_ohlc(symbol, args.timeframe)
            df = calculate_indicators(df)
            X, y, feature_cols, timestamps = prepare_features(df)
            
            if all_feature_names is None:
                all_feature_names = feature_cols
            elif feature_cols != all_feature_names:
                raise ValueError(f"Feature mismatch for {symbol}")
            
            all_X.append(X)
            all_y.append(y)
            all_timestamps.extend(timestamps)
            logger.info(f"✓ {symbol}: {len(X)} samples added")
        
        if not all_X:
            raise ValueError("No data fetched")
        
        # Combine
        X_combined = np.vstack(all_X)
        y_combined = np.concatenate(all_y)
        
        logger.info(f"\n✅ Combined dataset: {len(X_combined)} samples, {len(all_feature_names)} features")
        logger.info(f"Total class distribution: {pd.Series(y_combined).value_counts().to_dict()}")
        
        # Save CSV
        output_df = pd.DataFrame(X_combined, columns=all_feature_names)
        output_df['target'] = y_combined
        output_df.index = all_timestamps
        
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(output_path, index=True)
        logger.info(f"✓ Saved to {output_path}")
        
        # Also save feature names separately
        features_path = output_path.parent / (output_path.stem + '_features.json')
        with open(features_path, 'w') as f:
            json.dump(all_feature_names, f, indent=2)
        logger.info(f"✓ Feature names saved to {features_path}")
        
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
