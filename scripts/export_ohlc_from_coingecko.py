#!/usr/bin/env python3
"""
Export OHLC data from CoinGecko API for training
Run from project root: python scripts/export_ohlc_from_coingecko.py BTC 1h --limit 2000
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
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Symbol to CoinGecko ID mapping (same as in coingecko.ts)
COINGECKO_ID_MAP = {
    "BTC": "bitcoin",
    "BITCOIN": "bitcoin",
    "ETH": "ethereum",
    "ETHEREUM": "ethereum",
    "SOL": "solana",
    "SOLANA": "solana",
    "XRP": "ripple",
    "RIPPLE": "ripple",
    "DOGE": "dogecoin",
    "DOGECOIN": "dogecoin",
    "ADA": "cardano",
    "CARDANO": "cardano",
    "AVAX": "avalanche-2",
    "AVALANCHE": "avalanche-2",
    "MATIC": "matic-network",
    "POLYGON": "matic-network",
    "DOT": "polkadot",
    "POLKADOT": "polkadot",
    "LTC": "litecoin",
    "LITECOIN": "litecoin",
    "LINK": "chainlink",
    "CHAINLINK": "chainlink",
    "UNI": "uniswap",
    "UNISWAP": "uniswap",
    "SHIB": "shiba-inu",
    "SHIBAINU": "shiba-inu",
    "XAUT": "tether-gold",
    "GOLD": "tether-gold",
    "USDT": "tether",
    "USDC": "usd-coin",
    "BNB": "binancecoin",
}

def get_coingecko_id(symbol: str) -> str:
    normalized = symbol.upper().replace("USDT", "").replace("USD", "")
    coin_id = COINGECKO_ID_MAP.get(normalized)
    if not coin_id:
        raise ValueError(f"Unsupported symbol: {symbol}. Add mapping to COINGECKO_ID_MAP.")
    return coin_id

def fetch_coingecko_ohlc(symbol: str, timeframe: str, limit: int = 2000) -> pd.DataFrame:
    """
    Fetch OHLC data from CoinGecko API
    Returns DataFrame with columns: timestamp, open, high, low, close
    """
    coin_id = get_coingecko_id(symbol)
    vs_currency = "usd"

    # Determine days parameter based on timeframe and limit
    # CoinGecko: 1h granularity gives max 30 days (~720 candles)
    # For higher limit, we need to use daily data and resample
    if timeframe == "1h":
        days_needed = min(30, max(1, int(np.ceil(limit / 24))))  # hourly data max 30 days
    elif timeframe == "4h":
        days_needed = min(90, limit * 4)  # use daily data, later resample
    elif timeframe == "1d":
        days_needed = min(90, limit)
    else:
        raise ValueError(f"Unsupported timeframe: {timeframe}")

    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc"
    params = {
        "vs_currency": vs_currency,
        "days": str(days_needed),
    }

    logger.info(f"Fetching {symbol} ({coin_id}) {timeframe} from CoinGecko: days={days_needed}")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # CoinGecko returns: [[timestamp(ms), open, high, low, close], ...]
    if not data:
        raise ValueError(f"No data returned from CoinGecko for {symbol}")

    df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    df = df.sort_index()

    # If we need more data than available, we'll take what we can get
    if len(df) < limit:
        logger.warning(f"Only {len(df)} candles available, requested {limit}")

    # Resample to desired timeframe if using daily data for 4h
    if timeframe == "4h" and interval == "daily":
        # Upsample daily to 4h by forward-fill and create synthetic 4h bars
        # This is a simplified approach - in production you'd want more sophisticated
        df = df.resample('4H').ffill()
        # Add some noise to simulate intraday movement (optional)
        # For now, just use forward-filled prices

    # Take the last 'limit' rows
    df = df.iloc[-limit:]

    # Add volume as 0 (CoinGecko OHLC doesn't provide volume)
    df['volume'] = 0.0

    logger.info(f"Fetched {len(df)} rows for {symbol} {timeframe}")
    logger.info(f"Date range: {df.index[0]} to {df.index[-1]}")

    return df.reset_index().set_index('timestamp')

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators (same as in train.py)"""
    df = df.copy()

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

    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss.replace(0, np.finfo(float).eps)
    df['rsi'] = 100 - (100 / (1 + rs))

    # ATR
    high_low = df['high'] - df['low']
    high_close = np.abs(df['high'] - df['close'].shift())
    low_close = np.abs(df['low'] - df['close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()

    # ADX (placeholder)
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
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    raw_money_flow = typical_price * df['volume']
    positive_flow = raw_money_flow.where(typical_price > typical_price.shift(1), 0).rolling(14).sum()
    negative_flow = raw_money_flow.where(typical_price < typical_price.shift(1), 0).rolling(14).sum()
    money_flow_ratio = positive_flow / negative_flow.replace(0, np.finfo(float).eps)
    df['mfi'] = 100 - (100 / (1 + money_flow_ratio))

    # OBV
    df['obv'] = np.where(df['close'] > df['close'].shift(1), df['volume'],
                         np.where(df['close'] < df['close'].shift(1), -df['volume'], 0)).cumsum()

    # Fill NaN
    df = df.ffill().bfill()

    return df

def prepare_training_dataset(df: pd.DataFrame, lookback: int = 60, horizon: int = 1):
    """Prepare X (features) and y (target) for ML training"""
    df = df.copy()

    # Target: multi-class (0=hold, 1=buy, 2=sell)
    future_return = df['close'].shift(-horizon) / df['close'] - 1
    threshold = 0.002
    df['target'] = 0
    df.loc[future_return > threshold, 'target'] = 1
    df.loc[future_return < -threshold, 'target'] = 2

    # Feature columns
    feature_cols = [
        'close', 'volume', 'rsi', 'macd', 'macd_signal', 'macd_hist',
        'sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26',
        'bollinger_upper', 'bollinger_middle', 'bollinger_lower',
        'atr', 'adx', 'stoch_k', 'stoch_d', 'williams_r', 'cci', 'mfi', 'obv'
    ]

    # Add lagged closes
    for lag in range(1, lookback + 1):
        col = f'close_lag_{lag}'
        df[col] = df['close'].shift(lag)
        feature_cols.append(col)

    df = df.dropna()

    X = df[feature_cols].values
    y = df['target'].values

    logger.info(f"Dataset: {len(X)} samples, {len(feature_cols)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")

    return X, y, feature_cols

def main():
    parser = argparse.ArgumentParser(description='Export OHLC data from CoinGecko for training')
    parser.add_argument('symbol', help='Symbol (e.g., BTC)')
    parser.add_argument('timeframe', help='Timeframe (1h, 4h, 1d)')
    parser.add_argument('--limit', type=int, default=2000, help='Number of candles to fetch')
    parser.add_argument('--output', default=None, help='Output CSV path')
    parser.add_argument('--test', action='store_true', help='Test mode: fetch only, no CSV export')

    args = parser.parse_args()

    try:
        # Fetch from CoinGecko
        df = fetch_coingecko_ohlc(args.symbol, args.timeframe, args.limit)

        # Calculate indicators
        logger.info("Calculating indicators...")
        df = calculate_indicators(df)

        # Show summary
        logger.info(f"Fetched data shape: {df.shape}")
        logger.info(f"Columns: {df.columns.tolist()}")

        if args.test:
            logger.info("Test mode: showing first few rows")
            print(df.head())
            return

        # Prepare training dataset
        X, y, feature_cols = prepare_training_dataset(df, lookback=60)

        # Save to CSV
        output_df = pd.DataFrame(X, columns=feature_cols)
        output_df['target'] = y
        output_df.index = df.index[-len(X):]

        output_path = args.output or f"data/{args.symbol.upper()}_{args.timeframe}_train.csv"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(output_path, index=True)
        logger.info(f"✓ Training data saved to {output_path}")

        # Save feature names
        features_path = f"models/{args.symbol.upper()}-{args.timeframe}/feature_names.json"
        Path(features_path).parent.mkdir(parents=True, exist_ok=True)
        with open(features_path, 'w') as f:
            json.dump(feature_cols, f, indent=2)
        logger.info(f"✓ Feature names saved to {features_path}")

        logger.info("\nNext steps:")
        logger.info(f"  1. Train model: .venv/bin/python scripts/train_from_csv.py {args.symbol} {args.timeframe}")
        logger.info(f"  2. Test inference: .venv/bin/python scripts/inference_from_model.py {args.symbol} {args.timeframe}")

    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
