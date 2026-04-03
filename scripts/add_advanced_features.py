#!/usr/bin/env python3
"""
Advanced feature engineering for better model performance
Adds: volatility ratios, price transforms, cross-features, momentum clusters
"""

import pandas as pd
import numpy as np

def add_advanced_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add advanced technical features beyond basics"""
    df = df.copy()
    
    # === Price Transformations ===
    df['log_return'] = np.log(df['close'] / df['close'].shift(1))
    df['returns'] = df['close'].pct_change()
    
    # === Volatility Features ===
    df['volatility_20'] = df['returns'].rolling(20).std() * np.sqrt(252)  # annualized
    df['volatility_5'] = df['returns'].rolling(5).std() * np.sqrt(252)
    df['volatility_ratio'] = df['volatility_20'] / df['volatility_5'].rolling(20).mean()
    
    # === Price Range Features ===
    df['high_low_ratio'] = (df['high'] - df['low']) / df['close']
    df['close_open_ratio'] = (df['close'] - df['open']) / df['open']
    
    # Volume features
    df['volume_sma_ratio'] = df['volume'] / df['volume'].rolling(20).mean()
    df['volume_std'] = df['volume'].rolling(20).std()
    df['volume_z'] = (df['volume'] - df['volume'].rolling(20).mean()) / df['volume_std'].replace(0, 1)
    
    # === Momentum Features ===
    for lag in [1, 2, 3, 5, 10, 20]:
        df[f'momentum_{lag}'] = df['close'] / df['close'].shift(lag) - 1
    
    # RSI divergence (price vs RSI)
    df['rsi_5d'] = df['rsi'].rolling(5).mean()
    df['rsi_divergence'] = df['close'] - df['rsi_5d']
    
    # MACD histogram momentum
    df['macd_hist_momentum'] = df['macd_hist'] - df['macd_hist'].shift(1)
    
    # === Mean Reversion ===
    df['bb_position'] = (df['close'] - df['bollinger_lower']) / (df['bollinger_upper'] - df['bollinger_lower'])
    df['bb_width'] = (df['bollinger_upper'] - df['bollinger_lower']) / df['bollinger_middle']
    
    # === Trend Strength ===
    df['adx_normalized'] = df['adx'] / 100  # normalize to 0-1
    
    # SMA slopes
    df['sma_20_slope'] = (df['sma_20'] - df['sma_20'].shift(5)) / df['sma_20'].shift(5)
    df['sma_50_slope'] = (df['sma_50'] - df['sma_50'].shift(5)) / df['sma_50'].shift(5)
    
    # Price vs SMAs
    df['close_to_sma20'] = df['close'] / df['sma_20'] - 1
    df['close_to_sma50'] = df['close'] / df['sma_50'] - 1
    df['sma20_to_sma50'] = df['sma_20'] / df['sma_50'] - 1
    
    # ATR-based
    df['atr_percent'] = df['atr'] / df['close']
    
    # === Multi-timeframe features (approximated) ===
    df['sma_200_weekly'] = df['close'].rolling(200).mean()  # proxy for weekly
    df['trend_multi'] = (df['close'] > df['sma_20']).astype(int) + (df['sma_20'] > df['sma_50']).astype(int) + (df['sma_50'] > df['sma_200']).astype(int)
    
    # === Volume-Price relationship ===
    df['vpt'] = (df['volume'] * (df['close'] - df['close'].shift(1)) / df['close'].shift(1)).cumsum()  # Volume Price Trend
    df['volume_price_corr'] = df['volume'].rolling(20).corr(df['close'])
    
    # === Statistical features ===
    df['returns_kurtosis'] = df['returns'].rolling(60).kurt()
    df['returns_skew'] = df['returns'].rolling(60).skew()
    
    # Clean infinities and NaNs
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.ffill().bfill()
    
    return df

def prepare_features_advanced(df: pd.DataFrame, lookback: int = 60):
    """Prepare X and y with new feature set"""
    df = df.copy()
    
    # Target (same as before)
    future_return = df['close'].shift(-1) / df['close'] - 1
    threshold = 0.002
    df['target'] = 0
    df.loc[future_return > threshold, 'target'] = 1
    df.loc[future_return < -threshold, 'target'] = 2
    
    # Feature columns: all numeric except target and symbol
    exclude_cols = ['target', 'symbol'] if 'symbol' in df.columns else ['target']
    feature_cols = [c for c in df.columns if c not in exclude_cols and pd.api.types.is_numeric_dtype(df[c])]
    
    # Add lagged closes
    for lag in range(1, lookback + 1):
        df[f'close_lag_{lag}'] = df['close'].shift(lag)
        feature_cols.append(f'close_lag_{lag}')
    
    df = df.dropna()
    X = df[feature_cols].values
    y = df['target'].values
    
    logger = logging.getLogger(__name__)
    logger.info(f"Advanced features: {len(X)} samples, {len(feature_cols)} features")
    logger.info(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, feature_cols, df.index[-len(X):]

if __name__ == "__main__":
    import sys
    import logging
    logging.basicConfig(level=logging.INFO)
    
    if len(sys.argv) < 2:
        print("Usage: python add_advanced_features.py <input_csv> <output_csv>")
        sys.exit(1)
    
    input_csv, output_csv = sys.argv[1], sys.argv[2]
    
    logger = logging.getLogger(__name__)
    logger.info(f"Loading {input_csv}")
    df = pd.read_csv(input_csv, index_col=0)
    
    logger.info("Adding advanced features...")
    df_aug = add_advanced_features(df)
    
    # Prepare final training set
    X, y, feature_cols, index = prepare_features_advanced(df_aug)
    
    output_df = pd.DataFrame(X, columns=feature_cols)
    output_df['target'] = y
    output_df.index = index
    
    output_df.to_csv(output_csv)
    logger.info(f"Saved enhanced dataset to {output_csv}")
    logger.info(f"Features count: {len(feature_cols)}")
