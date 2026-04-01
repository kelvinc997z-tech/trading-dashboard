#!/usr/bin/env tsx
/**
 * Seed Quant AI Data
 * 
 * Populates database with:
 * - Sample predictions (LSTM, XGBoost, ensemble)
 * - Backtest results
 * - ML training data (OHLC + indicators)
 * - Model performance metrics
 * 
 * Usage: npx tsx scripts/seed-quant.ts [--user-id <id>]
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function getOrCreateUser() {
  // Try to get existing admin user
  let user = await prisma.user.findFirst({
    where: { email: 'admin@trading-dashboard.com' },
  });

  if (!user) {
    console.log('👤 Creating admin user for Quant AI seeding...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    user = await prisma.user.create({
      data: {
        email: 'admin@trading-dashboard.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'pro',
        verified: true,
        preferences: JSON.stringify({
          theme: 'dark',
          timeframe: '1h',
          quant_ai_enabled: true,
        }),
      },
    });
  }

  return user;
}

async function seedPredictions(userId: string) {
  console.log('\n🤖 Seeding Quant AI predictions...');
  
  const symbols = ['BTC', 'ETH', 'XAUT', 'SOL', 'XRP'];
  const timeframes = ['1h', '4h', '1d'];
  const modelTypes = ['lstm', 'xgboost', 'ensemble'];
  
  let count = 0;
  
  for (const symbol of symbols) {
    for (const timeframe of timeframes) {
      // Randomly select winning model
      const model = modelTypes[Math.floor(Math.random() * modelTypes.length)];
      const confidence = 0.6 + Math.random() * 0.35; // 60-95%
      const direction = Math.random() > 0.45 ? 'buy' : Math.random() > 0.1 ? 'neutral' : 'sell';
      
      // Generate plausible prediction
      const basePrice = symbol === 'BTC' ? 68000 : 
                       symbol === 'ETH' ? 2100 :
                       symbol === 'XAUT' ? 2350 :
                       symbol === 'SOL' ? 150 : 0.6;
      const predictedChange = (Math.random() - 0.5) * 0.1; // ±5%
      const predictedPrice = basePrice * (1 + predictedChange);
      
      const entryPrice = basePrice;
      const takeProfit = direction === 'buy' 
        ? predictedPrice * 1.02 
        : direction === 'sell' 
        ? predictedPrice * 0.98 
        : entryPrice;
      const stopLoss = direction === 'buy'
        ? entryPrice * 0.98
        : direction === 'sell'
        ? entryPrice * 1.02
        : null;
      
      // Check if prediction already exists (avoid duplicates)
      const existing = await prisma.prediction.findFirst({
        where: {
          userId,
          symbol,
          timeframe,
          modelType: model,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        },
      });
      
      if (!existing) {
        await prisma.prediction.create({
          data: {
            userId,
            symbol,
            timeframe,
            modelType: model,
            direction,
            confidence: Math.round(confidence * 100) / 100,
            price: predictedPrice,
            features: JSON.stringify({
              rsi: 30 + Math.random() * 40,
              macd: (Math.random() - 0.5) * 100,
              sma_ratio: 0.98 + Math.random() * 0.04,
              volume_ratio: 0.5 + Math.random() * 1.5,
              atr: basePrice * 0.01 + Math.random() * basePrice * 0.02,
            }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        });
        count++;
      }
    }
  }
  
  console.log(`   ✅ Created ${count} predictions across ${symbols.length} symbols`);
}

async function seedBacktests(userId: string) {
  console.log('\n📊 Seeding backtest results...');
  
  const strategies = ['Moving Average Crossover', 'RSI Oversold/Overbought', 'MACD Signal', 'ML Prediction'];
  const symbols = ['BTC', 'ETH', 'XAUT', 'SOL'];
  
  let count = 0;
  
  for (const strategy of strategies) {
    for (const symbol of symbols) {
      // Check if backtest already exists
      const existing = await prisma.performanceMetric.findFirst({
        where: {
          userId,
          period: `backtest_${strategy.toLowerCase().replace(/\s/g, '_')}`,
          startDate: new Date('2024-01-01'),
          endDate: new Date(),
        },
      });
      
      if (!existing) {
        // Generate realistic backtest metrics
        const totalTrades = 100 + Math.floor(Math.random() * 200);
        const winRate = 45 + Math.random() * 20; // 45-65%
        const avgWin = 0.8 + Math.random() * 1.2;
        const avgLoss = -(0.5 + Math.random() * 0.8);
        const profitFactor = (winRate/100 * avgWin) / ((1 - winRate/100) * Math.abs(avgLoss));
        const sharpeRatio = 0.5 + Math.random() * 1.5;
        const maxDrawdown = 5 + Math.random() * 15;
        const totalPnL = (totalTrades * (winRate/100 * avgWin + (1 - winRate/100) * avgLoss));
        
        await prisma.performanceMetric.create({
          data: {
            userId,
            period: `backtest_${strategy.toLowerCase().replace(/\s/g, '_')}`,
            startDate: new Date('2024-01-01'),
            endDate: new Date(),
            totalTrades,
            winRate: Math.round(winRate * 100) / 100,
            avgWin: Math.round(avgWin * 100) / 100,
            avgLoss: Math.round(avgLoss * 100) / 100,
            profitFactor: Math.round(profitFactor * 100) / 100,
            sharpeRatio: Math.round(sharpeRatio * 100) / 100,
            maxDrawdown: Math.round(maxDrawdown * 100) / 100,
            totalPnL: Math.round(totalPnL * 100) / 100,
            avgTradePnL: Math.round(totalPnL / totalTrades * 100) / 100,
            bestTrade: Math.round(avgWin * 3 * 100) / 100,
            worstTrade: Math.round(avgLoss * 2 * 100) / 100,
            avgHoldingMs: 8.64e+7 * (1 + Math.random()), // ~1-2 days
          },
        });
        count++;
      }
    }
  }
  
  console.log(`   ✅ Created ${count} backtest records for ${strategies.length} strategies`);
}

async function seedMLTrainingData(userId: string) {
  console.log('\n📚 Seeding ML training data (OHLC + indicators)...');
  
  const symbols = ['BTC', 'ETH', 'XAUT'];
  const timeframes = ['1h', '4h', '1d'];
  
  let count = 0;
  
  for (const symbol of symbols) {
    for (const timeframe of timeframes) {
      // Generate 500 historical data points
      const basePrice = symbol === 'BTC' ? 68000 : 
                       symbol === 'ETH' ? 2100 : 2350;
      
      for (let i = 500; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000); // 1h intervals
        
        // Check if exists
        const existing = await prisma.OHLCData.findFirst({
          where: { symbol, timeframe, timestamp },
        });
        
        if (!existing) {
          // Generate OHLC with some randomness
          const trend = (500 - i) / 500 * 0.2 - 0.1; // Slight upward trend
          const noise = (Math.random() - 0.5) * 0.04;
          const price = basePrice * (1 + trend + noise);
          const open = price * (1 + (Math.random() - 0.5) * 0.005);
          const close = price;
          const high = Math.max(open, close) * (1 + Math.random() * 0.01);
          const low = Math.min(open, close) * (1 - Math.random() * 0.01);
          const volume = 1000 + Math.random() * 9000;
          
          await prisma.OHLCData.create({
            data: {
              symbol,
              timeframe,
              timestamp,
              open: parseFloat(open.toFixed(2)),
              high: parseFloat(high.toFixed(2)),
              low: parseFloat(low.toFixed(2)),
              close: parseFloat(close.toFixed(2)),
              volume: parseFloat(volume.toFixed(2)),
            },
          });
          count++;
          
          // Also create indicator record (simplified)
          if (i % 4 === 0) { // Every 4th candle to reduce volume
            const rsi = 30 + Math.random() * 40;
            const macd = (Math.random() - 0.5) * 50;
            const atr = price * 0.01 + Math.random() * price * 0.01;
            
            await prisma.indicator.create({
              data: {
                symbol,
                timeframe,
                timestamp,
                rsi: parseFloat(rsi.toFixed(2)),
                macd: parseFloat(macd.toFixed(2)),
                macdSignal: parseFloat((macd * (0.8 + Math.random() * 0.4)).toFixed(2)),
                macdHist: parseFloat((macd * 0.2).toFixed(2)),
                sma20: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2)),
                sma50: parseFloat((price * (0.95 + Math.random() * 0.1)).toFixed(2)),
                sma200: parseFloat((price * (0.9 + Math.random() * 0.2)).toFixed(2)),
                ema12: parseFloat((price * (0.99 + Math.random() * 0.02)).toFixed(2)),
                ema26: parseFloat((price * (0.97 + Math.random() * 0.06)).toFixed(2)),
                bollingerUpper: parseFloat((price * 1.02).toFixed(2)),
                bollingerMiddle: price,
                bollingerLower: parseFloat((price * 0.98).toFixed(2)),
                atr: parseFloat(atr.toFixed(2)),
                adx: 20 + Math.random() * 30,
                stochK: 20 + Math.random() * 60,
                stochD: 20 + Math.random() * 60,
              },
            });
          }
        }
      }
      
      console.log(`   ✅ Generated OHLC+indicators for ${symbol} ${timeframe}`);
    }
  }
  
  console.log(`   ✅ Total records created: ${count} OHLC + indicators`);
}

async function seedModelPerformance(userId: string) {
  console.log('\n📈 Seeding model performance metrics...');
  
  const models = ['LSTM', 'XGBoost', 'Ensemble'];
  
  for (const model of models) {
    const existing = await prisma.performanceMetric.findFirst({
      where: {
        userId,
        period: `model_${model.toLowerCase()}`,
      },
    });
    
    if (!existing) {
      await prisma.performanceMetric.create({
        data: {
          userId,
          period: `model_${model.toLowerCase()}`,
          startDate: new Date('2024-01-01'),
          endDate: new Date(),
          totalTrades: 1000,
          winRate: 55 + Math.random() * 20,
          avgWin: 1.5 + Math.random(),
          avgLoss: -(1 + Math.random() * 0.5),
          profitFactor: 1.2 + Math.random() * 0.8,
          sharpeRatio: 0.8 + Math.random() * 1.2,
          maxDrawdown: 8 + Math.random() * 12,
          totalPnL: 2500 + Math.random() * 5000,
          avgTradePnL: 2.5 + Math.random() * 2,
          bestTrade: 150 + Math.random() * 100,
          worstTrade: -(80 + Math.random() * 50),
        },
      });
      console.log(`   ✅ Created performance metrics for ${model}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting Quant AI data seeding...\n');
    
    const user = await getOrCreateUser();
    console.log(`👤 Using user: ${user.email} (ID: ${user.id})`);
    
    await seedPredictions(user.id);
    await seedBacktests(user.id);
    await seedMLTrainingData(user.id);
    await seedModelPerformance(user.id);
    
    console.log('\n✅ Quant AI seeding completed!');
    console.log('\n📚 What was seeded:');
    console.log('   - AI predictions (LSTM, XGBoost, Ensemble) for 5 symbols × 3 timeframes');
    console.log('   - Backtest results for 4 strategies × 4 symbols');
    console.log('   - Historical OHLC data + technical indicators (500 points each)');
    console.log('   - Model performance metrics for each ML model');
    console.log('\n🎯 Next steps:');
    console.log('   1. Train actual models (scripts/train-models.ts)');
    console.log('   2. Test prediction API: GET /api/quant-ai/predict');
    console.log('   3. View Quant AI page: /quant-ai');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
