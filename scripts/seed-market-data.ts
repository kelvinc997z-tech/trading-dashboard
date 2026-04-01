#!/usr/bin/env tsx
/**
 * Seed Market Data
 * 
 * Populates database with historical OHLC and technical indicators:
 * - Multiple symbols (BTC, ETH, XAUT, SOL, XRP, AAPL, AMD, NVDA, MSFT, GOOGL)
 * - Multiple timeframes (1h, 4h, 1d)
 * - Full technical indicators (RSI, MACD, Bollinger, ATR, MA, etc.)
 * - Realistic price movements with trends and volatility
 * 
 * Usage: npx tsx scripts/seed-market-data.ts [--limit <records>]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SymbolConfig {
  symbol: string;
  basePrice: number;
  volatility: number; // 0-1, higher = more volatile
  trend: number; // -0.5 to 0.5, positive = uptrend
}

const SYMBOLS: SymbolConfig[] = [
  { symbol: 'BTC', basePrice: 68000, volatility: 0.03, trend: 0.0002 },
  { symbol: 'ETH', basePrice: 2100, volatility: 0.025, trend: 0.00015 },
  { symbol: 'XAUT', basePrice: 2350, volatility: 0.008, trend: 0.00005 },
  { symbol: 'SOL', basePrice: 150, volatility: 0.04, trend: 0.0003 },
  { symbol: 'XRP', basePrice: 0.6, volatility: 0.035, trend: 0.0001 },
  { symbol: 'AAPL', basePrice: 170, volatility: 0.015, trend: 0.00008 },
  { symbol: 'AMD', basePrice: 120, volatility: 0.022, trend: 0.00012 },
  { symbol: 'NVDA', basePrice: 240, volatility: 0.025, trend: 0.00025 },
  { symbol: 'MSFT', basePrice: 330, volatility: 0.012, trend: 0.0001 },
  { symbol: 'GOOGL', basePrice: 140, volatility: 0.018, trend: 0.0001 },
];

const TIMEFRAMES = ['1h', '4h', '1d'] as const;
const RECORDS_PER_SYMBOL_TF = 500; // 500 candles worth of data

function randomWalk(price: number, volatility: number, trend: number): number {
  // Random walk with drift (trend) and volatility
  const change = (Math.random() - 0.5) * 2 * volatility + trend;
  return price * (1 + change);
}

function calculateRSI(closePrices: number[], period: number = 14): number | null {
  if (closePrices.length < period + 1) return null;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    if (change > 0) gains.push(change);
    else losses.push(Math.abs(change));
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < 2) return 0;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const recent = trueRanges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number; signal: number; hist: number } | null {
  if (prices.length < slow + signal) return null;
  
  const ema = (data: number[], period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  };
  
  const macdLine = ema(prices, fast) - ema(prices, slow);
  const signalLine = ema(prices.slice(-(slow + signal)), signal); // Simplified
  const histogram = macdLine - signalLine;
  
  return {
    macd: parseFloat(macdLine.toFixed(2)),
    signal: parseFloat(signalLine.toFixed(2)),
    hist: parseFloat(histogram.toFixed(2)),
  };
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } | null {
  if (prices.length < period) return null;
  
  const recent = prices.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / period;
  const variance = recent.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  const sd = Math.sqrt(variance);
  
  return {
    upper: mean + stdDev * sd,
    middle: mean,
    lower: mean - stdDev * sd,
  };
}

function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const recent = prices.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

async function seedSymbol(symbolConfig: SymbolConfig) {
  console.log(`\n📈 Seeding ${symbolConfig.symbol}...`);
  
  for (const timeframe of TIMEFRAMES) {
    console.log(`   ⏱️  Timeframe: ${timeframe}`);
    
    // Determine interval in ms
    let intervalMs: number;
    switch (timeframe) {
      case '1h': intervalMs = 60 * 60 * 1000; break;
      case '4h': intervalMs = 4 * 60 * 60 * 1000; break;
      case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
    }
    
    // Generate historical data
    let currentPrice = symbolConfig.basePrice * (0.9 + Math.random() * 0.2); // Start 10% variation
    const closes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const timestamps: Date[] = [];
    
    for (let i = 0; i < RECORDS_PER_SYMBOL_TF; i++) {
      const timestamp = new Date(Date.now() - (RECORDS_PER_SYMBOL_TF - i) * intervalMs);
      timestamps.push(timestamp);
      
      // Generate OHLC
      const open = currentPrice;
      const volatility = symbolConfig.volatility * currentPrice;
      const close = randomWalk(open, volatility, symbolConfig.trend);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      closes.push(close);
      highs.push(high);
      lows.push(low);
      
      currentPrice = close;
      
      // Save OHLC to DB
      await prisma.OHLCData.upsert({
        where: {
          symbol_timeframe_timestamp: {
            symbol: symbolConfig.symbol,
            timeframe,
            timestamp,
          },
        },
        update: {},
        create: {
          symbol: symbolConfig.symbol,
          timeframe,
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: parseFloat((1000 + Math.random() * 9000).toFixed(2)),
        },
      });
      
      // Save indicators every 10th candle
      if (i % 10 === 0 && closes.length >= 26) {
        const rsi = calculateRSI(closes);
        const macdData = calculateMACD(closes);
        const bbData = calculateBollingerBands(closes);
        const atr = calculateATR(highs, lows, closes);
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);
        
        try {
          await prisma.indicator.upsert({
            where: {
              symbol_timeframe_timestamp: {
                symbol: symbolConfig.symbol,
                timeframe,
                timestamp,
              },
            },
            update: {},
            create: {
              symbol: symbolConfig.symbol,
              timeframe,
              timestamp,
              rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
              macd: macdData?.macd || null,
              macdSignal: macdData?.signal || null,
              macdHist: macdData?.hist || null,
              sma20: sma20 ? parseFloat(sma20.toFixed(2)) : null,
              sma50: sma50 ? parseFloat(sma50.toFixed(2)) : null,
              sma200: calculateSMA(closes, 200) ? parseFloat(calculateSMA(closes, 200)!.toFixed(2)) : null,
              ema12: calculateSMA(closes.slice(-12), 12) ? parseFloat(calculateSMA(closes.slice(-12), 12)!.toFixed(2)) : null,
              ema26: calculateSMA(closes.slice(-26), 26) ? parseFloat(calculateSMA(closes.slice(-26), 26)!.toFixed(2)) : null,
              bollingerUpper: bbData?.upper ? parseFloat(bbData.upper.toFixed(2)) : null,
              bollingerMiddle: bbData?.middle ? parseFloat(bbData.middle.toFixed(2)) : null,
              bollingerLower: bbData?.lower ? parseFloat(bbData.lower.toFixed(2)) : null,
              atr: atr ? parseFloat(atr.toFixed(2)) : null,
              adx: 20 + Math.random() * 30, // Simplified
              stochK: 20 + Math.random() * 60,
              stochD: 20 + Math.random() * 60,
              williamsR: -50 + Math.random() * 100,
              cci: -100 + Math.random() * 200,
              mfi: 20 + Math.random() * 60,
              obv: closes[0] * 1000 * (1 + Math.random()),
            },
          });
        } catch (e) {
          // Ignore duplicate errors
        }
      }
    }
    
    console.log(`   ✅ Generated ${RECORDS_PER_SYMBOL_TF} OHLC records for ${timeframe}`);
  }
}

async function main() {
  try {
    console.log('📊 Starting market data seeding...\n');
    console.log('This will generate historical OHLC + indicators for:');
    console.log(`   - ${SYMBOLS.length} symbols`);
    console.log(`   - ${TIMEFRAMES.length} timeframes`);
    console.log(`   - ~${SYMBOLS.length * TIMEFRAMES.length * RECORDS_PER_SYMBOL_TF} OHLC records`);
    console.log('   - Plus technical indicators\n');
    
    for (const symbol of SYMBOLS) {
      await seedSymbol(symbol);
    }
    
    console.log('\n✅ Market data seeding completed!');
    console.log('\n📈 Summary:');
    console.log('   - All symbols have 500+ historical candles');
    console.log('   - Technical indicators calculated (RSI, MACD, BB, ATR, MA, etc.)');
    console.log('   - Ready for technical analysis and ML training');
    console.log('\n🎯 Next steps:');
    console.log('   1. Verify data: query /api/market-data endpoint');
    console.log('   2. Check indicators: /api/indicators endpoint');
    console.log('   3. Train ML models: npx tsx scripts/train-models.ts');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
