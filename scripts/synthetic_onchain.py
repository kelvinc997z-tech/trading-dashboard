#!/usr/bin/env python3
"""
Generate synthetic on-chain features from OHLC data
These mimic real on-chain metrics (exchange flows, whale activity) derived from price/volume
Use when real on-chain API unavailable
"""

import pandas as pd
import numpy as np
from pathlib import Path

def add_synthetic_onchain_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add synthetic blockchain-derived features that correlate with price action
    These are approximations based on volume, volatility, and price patterns
    """
    df = df.copy()
    
    # 1. Exchange Flow Proxy (Volume spikes indicate movement to/from exchanges)
    # High volume + price drop = net outflow (whales withdrawing)
    # High volume + price rise = net inflow (whales depositing)
    volume_z = (df['volume'] - df['volume'].rolling(20).mean()) / df['volume'].rolling(20).std().replace(0, 1)
    price_change = df['close'].pct_change()
    
    # Exchange inflow proxy: volume spike + price up (people depositing to sell)
    df['syn_exchange_inflows'] = np.where(
        (volume_z > 1) & (price_change > 0),
        volume_z * df['volume'] * 0.001,  # scaled
        0
    )
    
    # Exchange outflow proxy: volume spike + price down (whales withdrawing)
    df['syn_exchange_outflows'] = np.where(
        (volume_z > 1) & (price_change < 0),
        volume_z * df['volume'] * 0.001,
        0
    )
    
    # 2. Whale Activity Proxy (large transactions)
    # Large price moves with high volume indicate whale activity
    big_move = (abs(price_change) > 0.03) & (volume_z > 1.5)
    df['syn_whale_activity'] = big_move.astype(float).rolling(5).sum()
    
    # 3. Miner Pressure Proxy (using volume and RSI)
    # Miners sell into strength (high RSI + high volume)
    df['syn_miner_outflows'] = np.where(
        (df['rsi'] > 70) & (volume_z > 1),
        df['volume'] * 0.0001,
        0
    )
    
    # 4. Network Activity Proxy (transaction count approx)
    # High volatility + high volume = more network activity
    volatility = df['close'].rolling(20).std() / df['close'].rolling(20).mean()
    df['syn_network_activity'] = (volatility * df['volume'] / df['volume'].mean()).rolling(5).mean()
    
    # 5. Funding Rates Proxy (perpetual futures pressure)
    # High RSI + high volume = bullish pressure (positive funding)
    df['syn_funding_rates'] = np.where(
        df['rsi'] > 70,
        (df['rsi'] - 50) * 0.001,
        np.where(
            df['rsi'] < 30,
            (df['rsi'] - 50) * 0.001,
            0
        )
    )
    
    # 6. Open Interest Proxy (derivatives activity)
    # OI increases with volume and volatility
    df['syn_open_interest'] = (df['volume'].rolling(5).sum() * volatility).rolling(10).mean()
    
    # 7. Supply on Exchanges (ratio of volume to market cap approx)
    # Simplified: high volume relative to price = more supply on exchanges
    df['syn_exchange_supply_ratio'] = (df['volume'] / df['close']).rolling(20).rank(pct=True)
    
    # 8. Active Addresses Proxy (network usage)
    # Based on transaction count approximation
    df['syn_active_addresses'] = df['syn_network_activity'] * 1000
    
    # Fill NaNs
    df = df.ffill().bfill()
    
    # Normalize some features to reasonable ranges
    for col in ['syn_exchange_inflows', 'syn_exchange_outflows', 'syn_miner_outflows']:
        if col in df.columns:
            # Scale to millions USD approx
            df[col] = df[col] / df[col].max() * 1000000
    
    return df

def evaluate_synthetic_features(df: pd.DataFrame):
    """Check correlation between synthetic features and price"""
    features = [c for c in df.columns if c.startswith('syn_')]
    corrs = df[features + ['close']].corr()['close'].sort_values(ascending=False)
    print("Synthetic feature correlations with price:")
    print(corrs)
    return corrs

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python synthetic_onchain.py <input_csv> <output_csv>")
        sys.exit(1)
    
    input_csv, output_csv = sys.argv[1], sys.argv[2]
    print(f"Loading {input_csv}")
    df = pd.read_csv(input_csv, index_col=0)
    
    print("Adding synthetic on-chain features...")
    df = add_synthetic_onchain_features(df)
    
    # Show correlations
    corrs = evaluate_synthetic_features(df)
    
    # Save
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv)
    print(f"Saved to {output_csv}")
    print(f"Total features: {len(df.columns)}")
