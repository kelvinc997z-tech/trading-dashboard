#!/usr/bin/env python3
"""
Quant AI - Backtesting Engine
Evaluates model performance on historical data
"""

import json
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

@dataclass
class TradeResult:
    timestamp: str
    symbol: str
    direction: str  # buy/sell
    entry_price: float
    exit_price: float
    pnl_pct: float
    pnl_abs: float
    holding_periods: int
    confidence: float
    reason: str  # e.g., "model_signal", "stop_loss", "take_profit"

@dataclass
class BacktestMetrics:
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float
    total_return: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    avg_holding_periods: float
    equity_curve: List[float]
    trades: List[TradeResult]

class QuantBacktester:
    def __init__(self, symbol: str, timeframe: str = "1h", initial_capital: float = 10000):
        self.symbol = symbol.upper()
        self.timeframe = timeframe
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.trades: List[TradeResult] = []
        self.equity_curve = [initial_capital]
        
        # Parameters (configurable)
        self.position_size_pct = 0.1  # 10% of capital per trade
        self.take_profit_pct = 0.02  # 2%
        self.stop_loss_pct = 0.01    # 1%
        self.confidence_threshold = 0.6  # Only trade with confidence > 60%
    
    def simulate_trade(self, entry_idx: int, direction: str, confidence: float, 
                       ohlc_df: pd.DataFrame, prediction_data: dict) -> TradeResult:
        """Simulate a single trade with TP/SL"""
        entry_price = ohlc_df.iloc[entry_idx]['close']
        capital = self.capital * self.position_size_pct
        
        # Determine TP/SL levels
        if direction == "buy":
            tp_level = entry_price * (1 + self.take_profit_pct)
            sl_level = entry_price * (1 - self.stop_loss_pct)
        else:  # sell
            tp_level = entry_price * (1 - self.take_profit_pct)
            sl_level = entry_price * (1 + self.stop_loss_pct)
        
        # Walk forward until TP or SL hit
        for i in range(entry_idx + 1, len(ohlc_df)):
            current_price = ohlc_df.iloc[i]['close']
            holding_periods = i - entry_idx
            
            if direction == "buy":
                if current_price >= tp_level:
                    pnl_pct = self.take_profit_pct
                    reason = "take_profit"
                    break
                elif current_price <= sl_level:
                    pnl_pct = -self.stop_loss_pct
                    reason = "stop_loss"
                    break
            else:  # sell
                if current_price <= tp_level:
                    pnl_pct = self.take_profit_pct
                    reason = "take_profit"
                    break
                elif current_price >= sl_level:
                    pnl_pct = -self.stop_loss_pct
                    reason = "stop_loss"
                    break
            # Max hold: 24 periods (e.g., 24 hours for 1h timeframe)
            if holding_periods >= 24:
                pnl_pct = (current_price - entry_price) / entry_price
                if direction == "sell":
                    pnl_pct = -pnl_pct
                reason = "max_hold"
                break
        else:
            # Reached end of data
            last_price = ohlc_df.iloc[-1]['close']
            pnl_pct = (last_price - entry_price) / entry_price if direction == "buy" else (entry_price - last_price) / entry_price
            reason = "end_of_data"
            holding_periods = len(ohlc_df) - entry_idx - 1
        
        pnl_abs = capital * pnl_pct
        exit_price = entry_price * (1 + pnl_pct) if direction == "buy" else entry_price * (1 - pnl_pct)
        
        return TradeResult(
            timestamp=ohlc_df.iloc[entry_idx]['timestamp'].isoformat() if isinstance(ohlc_df.iloc[entry_idx]['timestamp'], pd.Timestamp) else str(ohlc_df.iloc[entry_idx]['timestamp']),
            symbol=self.symbol,
            direction=direction,
            entry_price=round(entry_price, 4),
            exit_price=round(exit_price, 4),
            pnl_pct=round(pnl_pct * 100, 2),
            pnl_abs=round(pnl_abs, 2),
            holding_periods=holding_periods,
            confidence=confidence,
            reason=reason
        )
    
    def run(self, ohlc_df: pd.DataFrame, predictions: List[dict]) -> BacktestMetrics:
        """
        Run backtest on historical data with predictions.
        
        Args:
            ohlc_df: DataFrame with columns ['timestamp', 'open', 'high', 'low', 'close', 'volume']
            predictions: List of prediction dicts, each with 'timestamp', 'direction', 'confidence'
        """
        logger.info(f"Starting backtest for {self.symbol} with {len(predictions)} predictions")
        
        # Align predictions with OHLC timestamps
        ohlc_df = ohlc_df.copy().reset_index(drop=True)
        ohlc_df['timestamp'] = pd.to_datetime(ohlc_df['timestamp'])
        
        # Sort predictions by timestamp
        pred_df = pd.DataFrame(predictions)
        if 'timestamp' in pred_df.columns:
            pred_df['timestamp'] = pd.to_datetime(pred_df['timestamp'])
            pred_df = pred_df.sort_values('timestamp').reset_index(drop=True)
        
        # Simulate trades
        for _, pred in pred_df.iterrows():
            # Find matching OHLC row (allow some tolerance)
            idx = ohlc_df[ohlc_df['timestamp'] >= pred['timestamp']].index[0] if len(ohlc_df[ohlc_df['timestamp'] >= pred['timestamp']]) > 0 else None
            
            if idx is None or idx >= len(ohlc_df) - 1:
                continue  # Not enough data after prediction
            
            # Only trade if confidence above threshold
            if pred['confidence'] / 100 < self.confidence_threshold:
                continue
            
            # Check if we already have an open trade (simple: one trade at a time)
            # In multi-trade version, manage positions separately
            if self.trades and self.trades[-1].reason not in ['take_profit', 'stop_loss', 'end_of_data']:
                continue  # Still in open trade
            
            direction = pred['direction']
            if direction not in ['buy', 'sell']:
                continue  # Skip neutral
            
            trade = self.simulate_trade(idx, direction, pred['confidence'], ohlc_df, pred)
            self.trades.append(trade)
            
            # Update capital
            self.capital += trade.pnl_abs
            self.equity_curve.append(self.capital)
        
        # Calculate metrics
        total_trades = len(self.trades)
        if total_trades == 0:
            logger.warning("No trades executed")
            return BacktestMetrics(
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0,
                avg_win=0,
                avg_loss=0,
                profit_factor=0,
                total_return=0,
                max_drawdown=0,
                sharpe_ratio=0,
                sortino_ratio=0,
                avg_holding_periods=0,
                equity_curve=self.equity_curve,
                trades=self.trades,
            )
        
        winning_trades = sum(1 for t in self.trades if t.pnl_abs > 0)
        losing_trades = total_trades - winning_trades
        win_rate = (winning_trades / total_trades) * 100
        
        wins = [t.pnl_abs for t in self.trades if t.pnl_abs > 0]
        losses = [abs(t.pnl_abs) for t in self.trades if t.pnl_abs < 0]
        
        avg_win = np.mean(wins) if wins else 0
        avg_loss = np.mean(losses) if losses else 0
        profit_factor = sum(wins) / (sum(losses) if sum(losses) > 0 else 1)
        
        total_return = ((self.capital - self.initial_capital) / self.initial_capital) * 100
        
        # Max drawdown
        peak = self.equity_curve[0]
        max_dd = 0
        for equity in self.equity_curve:
            if equity > peak:
                peak = equity
            dd = (peak - equity) / peak * 100
            if dd > max_dd:
                max_dd = dd
        
        # Sharpe ratio (assuming 0% risk-free rate, per-period returns)
        returns = np.diff(self.equity_curve) / self.equity_curve[:-1]
        if len(returns) > 0 and returns.std() > 0:
            sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(365 * 24 / int(self.timeframe.rstrip('hdm') or 1))  # annualized
        else:
            sharpe_ratio = 0
        
        # Sortino ratio (downside deviation)
        downside_returns = returns[returns < 0]
        if len(downside_returns) > 0 and downside_returns.std() > 0:
            sortino_ratio = (returns.mean() / downside_returns.std()) * np.sqrt(365 * 24 / int(self.timeframe.rstrip('hdm') or 1))
        else:
            sortino_ratio = 0
        
        avg_holding = np.mean([t.holding_periods for t in self.trades])
        
        return BacktestMetrics(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=round(win_rate, 2),
            avg_win=round(avg_win, 2),
            avg_loss=round(avg_loss, 2),
            profit_factor=round(profit_factor, 2),
            total_return=round(total_return, 2),
            max_drawdown=round(max_dd, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            sortino_ratio=round(sortino_ratio, 2),
            avg_holding_periods=round(avg_holding, 1),
            equity_curve=self.equity_curve,
            trades=self.trades,
        )

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Run backtest for quant model")
    parser.add_argument("--symbol", required=True, help="Trading symbol")
    parser.add_argument("--timeframe", default="1h", help="Timeframe")
    parser.add_argument("--data", required=True, help="Path to OHLC CSV file")
    parser.add_argument("--predictions", required=True, help="Path to predictions JSON file")
    parser.add_argument("--output", help="Output JSON file for results")
    
    args = parser.parse_args()
    
    # Load data
    ohlc_df = pd.read_csv(args.data)
    with open(args.predictions, 'r') as f:
        predictions = json.load(f)
    
    # Run backtest
    backtester = QuantBacktester(args.symbol, args.timeframe)
    metrics = backtester.run(ohlc_df, predictions)
    
    # Convert to dict for JSON serialization
    result = asdict(metrics)
    # Convert TradeResult objects to dicts
    result['trades'] = [asdict(t) for t in metrics.trades]
    
    # Print JSON
    print(json.dumps(result, indent=2, default=str))
    
    # Save if output specified
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        print(f"Results saved to {args.output}")

if __name__ == "__main__":
    main()
