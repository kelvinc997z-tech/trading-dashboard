#!/usr/bin/env python3
"""
Export OHLC + Indicator data from Prisma database to CSV for training
"""

import sys
import json
import asyncio
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from prisma import Prisma

async def export_symbol(symbol: str, timeframe: str, output_dir: str = "data"):
    """Export OHLC + indicators for a symbol/timeframe to CSV"""
    db = Prisma()
    await db.connect()
    
    try:
        # Fetch OHLC data
        ohlc_records = await db.oHLCData.find_many(
            where={
                'symbol': symbol.upper(),
                'timeframe': timeframe,
            },
            order_by={
                'timestamp': 'asc',
            },
            include={
                'Indicator': True,
            }
        )
        
        if not ohlc_records:
            print(f"No data found for {symbol} {timeframe}")
            return None
        
        # Convert to DataFrame
        rows = []
        for record in ohlc_records:
            row = {
                'timestamp': record.timestamp.isoformat() if record.timestamp else None,
                'open': float(record.open),
                'high': float(record.high),
                'low': float(record.low),
                'close': float(record.close),
                'volume': float(record.volume) if record.volume else 0,
            }
            
            # Add indicators if available
            ind = record.Indicator
            if ind:
                row.update({
                    'rsi': float(ind.rsi) if ind.rsi else None,
                    'macd': float(ind.macd) if ind.macd else None,
                    'macd_signal': float(ind.macdSignal) if ind.macdSignal else None,
                    'macd_hist': float(ind.macdHist) if ind.macdHist else None,
                    'sma_20': float(ind.sma20) if ind.sma20 else None,
                    'sma_50': float(ind.sma50) if ind.sma50 else None,
                    'sma_200': float(ind.sma200) if ind.sma200 else None,
                    'ema_12': float(ind.ema12) if ind.ema12 else None,
                    'ema_26': float(ind.ema26) if ind.ema26 else None,
                    'bollinger_upper': float(ind.bollingerUpper) if ind.bollingerUpper else None,
                    'bollinger_middle': float(ind.bollingerMiddle) if ind.bollingerMiddle else None,
                    'bollinger_lower': float(ind.bollingerLower) if ind.bollingerLower else None,
                    'atr': float(ind.atr) if ind.atr else None,
                    'adx': float(ind.adx) if ind.adx else None,
                    'stoch_k': float(ind.stochK) if ind.stochK else None,
                    'stoch_d': float(ind.stochD) if ind.stochD else None,
                    'williams_r': float(ind.williamsR) if ind.williamsR else None,
                    'cci': float(ind.cci) if ind.cci else None,
                    'mfi': float(ind.mfi) if ind.mfi else None,
                    'obv': float(ind.obv) if ind.obv else None,
                })
            
            rows.append(row)
        
        df = pd.DataFrame(rows)
        
        # Save to CSV
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        csv_file = output_path / f"{symbol.lower()}_{timeframe}.csv"
        df.to_csv(csv_file, index=False)
        
        print(f"✓ Exported {len(df)} rows to {csv_file}")
        return str(csv_file)
        
    finally:
        await db.disconnect()

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Export OHLC data to CSV")
    parser.add_argument("--symbol", required=True, help="Symbol (e.g., BTC, ETH)")
    parser.add_argument("--timeframe", required=True, help="Timeframe (e.g., 1h, 4h, 1d)")
    parser.add_argument("--output-dir", default="data", help="Output directory")
    
    args = parser.parse_args()
    
    csv_path = await export_symbol(args.symbol, args.timeframe, args.output_dir)
    if csv_path:
        print(f"Data ready for training: python scripts/train.py --symbol {args.symbol.upper()} --timeframe {args.timeframe} --data {csv_path}")

if __name__ == "__main__":
    asyncio.run(main())
