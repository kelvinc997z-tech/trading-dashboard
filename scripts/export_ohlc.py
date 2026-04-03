#!/usr/bin/env python3
"""
Export OHLC data from database to CSV for training
Run from project root: python scripts/export_ohlc.py BTC 1h
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

# Add parent directory to path to import env
sys.path.append(str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

# Try to import psycopg2
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_DB = True
except ImportError:
    HAS_DB = False
    print("psycopg2 not installed. Install with: pip install psycopg2-binary")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_ohlc_from_db(symbol: str, timeframe: str, limit: int = 5000) -> pd.DataFrame:
    """Fetch OHLC data from Supabase PostgreSQL"""
    if not HAS_DB:
        raise ImportError("psycopg2 required")

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set in environment")

    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT symbol, timeframe, timestamp, open, high, low, close, volume
        FROM "OHLCData"
        WHERE symbol = %s AND timeframe = %s
        ORDER BY timestamp ASC
        LIMIT %s
    """

    cursor.execute(query, (symbol.upper(), timeframe, limit))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        raise ValueError(f"No OHLC data found for {symbol} {timeframe}")

    df = pd.DataFrame(rows)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df.set_index('timestamp', inplace=True)

    logger.info(f"Fetched {len(df)} rows for {symbol} {timeframe}")
    return df

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators"""
    # Simple Moving Averages
    df['sma_20'] = df['close'].rolling(20).mean()
    df['sma_50'] = df['close'].rolling(50).mean()
    df['sma_200'] = df['close'].rolling(200).mean()

    # Exponential Moving Averages
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

    # RSI (simplified)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # ATR (Average True Range)
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()

    # ADX (simplified)
    # For full ADX, need +DM and -DM. Skipping full calc for now.
    df['adx'] = 25.0  # placeholder

    # Stochastic Oscillator
    low_14 = df['low'].rolling(14).min()
    high_14 = df['high'].rolling(14).max()
    df['stoch_k'] = 100 * ((df['close'] - low_14) / (high_14 - low_14))
    df['stoch_d'] = df['stoch_k'].rolling(3).mean()

    # Williams %R
    highest_high = df['high'].rolling(14).max()
    lowest_low = df['low'].rolling(14).min()
    df['williams_r'] = -100 * ((highest_high - df['close']) / (highest_high - lowest_low))

    # CCI (Commodity Channel Index)
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    sma_tp = typical_price.rolling(20).mean()
    mean_dev = typical_price.rolling(20).apply(lambda x: np.mean(np.abs(x - x.mean())))
    df['cci'] = (typical_price - sma_tp) / (0.015 * mean_dev)

    # MFI (Money Flow Index)
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    raw_money_flow = typical_price * df['volume']
    positive_flow = raw_money_flow.where(typical_price > typical_price.shift(1), 0).rolling(14).sum()
    negative_flow = raw_money_flow.where(typical_price < typical_price.shift(1), 0).rolling(14).sum()
    money_flow_ratio = positive_flow / negative_flow.replace(0, np.finfo(float).eps)
    df['mfi'] = 100 - (100 / (1 + money_flow_ratio))

    # OBV (On-Balance Volume)
    df['obv'] = np.where(df['close'] > df['close'].shift(1), df['volume'],
                         np.where(df['close'] < df['close'].shift(1), -df['volume'], 0)).cumsum()

    # Fill NaN values (forward fill then backward)
    df = df.ffill().bfill()

    return df

def prepare_training_dataset(df: pd.DataFrame, lookback: int = 60, horizon: int = 1):
    """Prepare X (features) and y (target) for ML training"""
    df = df.copy()

    # Target: multi-class (0=hold, 1=buy, 2=sell)
    future_return = df['close'].shift(-horizon) / df['close'] - 1
    threshold = 0.002  # 0.2% minimum move
    df['target'] = 0  # hold
    df.loc[future_return > threshold, 'target'] = 1  # buy
    df.loc[future_return < -threshold, 'target'] = 2  # sell

    # Feature columns
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

    # Drop rows with NaN (from indicators and lags)
    df = df.dropna()

    X = df[feature_cols].values
    y = df['target'].values

    logger.info(f"Dataset prepared: {len(X)} samples, {len(feature_cols)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")

    return X, y, feature_cols

def main():
    parser = argparse.ArgumentParser(description='Export OHLC data for training')
    parser.add_argument('symbol', help='Symbol (e.g., BTC)')
    parser.add_argument('timeframe', help='Timeframe (e.g., 1h, 4h, 1d)')
    parser.add_argument('--limit', type=int, default=5000, help='Max rows to fetch')
    parser.add_argument('--output', default=None, help='Output CSV path (default: data/{symbol}_{timeframe}.csv)')

    args = parser.parse_args()

    try:
        # Fetch from database
        df = fetch_ohlc_from_db(args.symbol, args.timeframe, args.limit)

        # Calculate indicators
        logger.info("Calculating indicators...")
        df = calculate_indicators(df)

        # Prepare training dataset
        X, y, feature_cols = prepare_training_dataset(df, lookback=60)

        # Save to CSV (features + target)
        output_df = pd.DataFrame(X, columns=feature_cols)
        output_df['target'] = y
        output_df.index = df.index[-len(X):]  # align timestamps

        output_path = args.output or f"data/{args.symbol.upper()}_{args.timeframe}_train.csv"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(output_path, index=True)
        logger.info(f"Training data saved to {output_path}")

        # Also save feature names
        features_path = f"models/{args.symbol.upper()}-{args.timeframe}/feature_names.json"
        Path(features_path).parent.mkdir(parents=True, exist_ok=True)
        with open(features_path, 'w') as f:
            json.dump(feature_cols, f, indent=2)
        logger.info(f"Feature names saved to {features_path}")

    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
