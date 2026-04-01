import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Create default admin user (if not exists)
  const adminEmail = 'admin@trading-dashboard.com';
  let user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    console.log('👤 Creating default admin user...');
    const hashedPassword = await hashPassword('Admin123!'); // Default password - CHANGE AFTER FIRST LOGIN
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'pro',
        verified: true,
        preferences: JSON.stringify({
          theme: 'dark',
          timeframe: '1h',
          notifications: {
            email: true,
            telegram: false,
          },
          quant_ai_enabled: true,
        }),
      },
    });
    console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);
    console.log(`   🔑 Default password: Admin123! (change after login)`);
  } else {
    console.log(`👤 Admin user already exists: ${user.email}`);
  }

  // 2. Seed sample trades (if empty)
  const existingTrades = await prisma.trade.count({
    where: { userId: user.id },
  });

  if (existingTrades === 0) {
    console.log('\n📊 Seeding sample trades...');
    const sampleTrades = [
      {
        userId: user.id,
        symbol: 'BTC',
        side: 'buy',
        entry: 68000,
        size: 1.5,
        stopLoss: 67000,
        takeProfit: 70000,
        status: 'open',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: user.id,
        symbol: 'ETH',
        side: 'buy',
        entry: 2100,
        size: 10,
        stopLoss: 2000,
        takeProfit: 2300,
        status: 'open',
        date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        userId: user.id,
        symbol: 'XAUT',
        side: 'sell',
        entry: 2350,
        size: 2,
        stopLoss: 2400,
        takeProfit: 2250,
        status: 'closed',
        exit: 2240,
        exitDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        pnl: 220, // (2350-2240)*2 = 220
        pnlPct: 4.68,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      },
    ];

    for (const trade of sampleTrades) {
      await prisma.trade.create({ data: trade });
      console.log(`   ✅ Created trade: ${trade.side} ${trade.symbol} @ ${trade.entry}`);
    }
  } else {
    console.log(`📊 Already have ${existingTrades} trades, skipping...`);
  }

  // 3. Seed performance metrics (all-time)
  const existingPerf = await prisma.performanceMetric.count({
    where: { userId: user.id, period: 'all-time' },
  });

  if (existingPerf === 0) {
    console.log('\n📈 Seeding performance metrics...');
    await prisma.performanceMetric.create({
      data: {
        userId: user.id,
        period: 'all-time',
        startDate: new Date('2024-01-01'),
        endDate: new Date(),
        totalTrades: 150,
        winRate: 62.5,
        avgWin: 1.8,
        avgLoss: -1.2,
        profitFactor: 1.75,
        sharpeRatio: 1.4,
        maxDrawdown: 12.5,
        totalPnL: 3450.75,
        avgTradePnL: 23.00,
        bestTrade: 150.25,
        worstTrade: -85.50,
        avgHoldingMs: 8.64e+7, // ~1 day in ms
      },
    });
    console.log('✅ Created all-time performance metrics');
  } else {
    console.log('📈 Performance metrics already exist');
  }

  // 4. Seed sample alerts
  const existingAlerts = await prisma.alert.count({
    where: { userId: user.id },
  });

  if (existingAlerts === 0) {
    console.log('\n🔔 Seeding sample alerts...');
    const sampleAlerts = [
      {
        userId: user.id,
        type: 'price',
        symbol: 'BTC',
        condition: 'above',
        value: 70000,
        timeframe: '1h',
        notificationChannel: 'email',
        isActive: true,
      },
      {
        userId: user.id,
        type: 'indicator',
        symbol: 'ETH',
        indicator: 'rsi',
        condition: 'below',
        value: 30,
        timeframe: '4h',
        notificationChannel: 'telegram',
        isActive: true,
      },
    ];

    for (const alert of sampleAlerts) {
      await prisma.alert.create({ data: alert });
      console.log(`   ✅ Created alert: ${alert.type} for ${alert.symbol || 'all'}`);
    }
  } else {
    console.log(`🔔 Already have ${existingAlerts} alerts, skipping...`);
  }

  // 5. Seed correlation cache (sample)
  const today = new Date().toISOString().split('T')[0];
  const existingCorr = await prisma.correlationCache.findFirst({
    where: {
      date: today,
      period: '1d',
    },
  });

  if (!existingCorr) {
    console.log('\n🔗 Seeding correlation matrix...');
    await prisma.correlationCache.create({
      data: {
        date: new Date(),
        period: '1d',
        data: JSON.stringify({
          'BTC/USD': { 'ETH/USD': 0.78, 'SOL/USD': 0.65, 'XAUT/USD': 0.15 },
          'ETH/USD': { 'BTC/USD': 0.78, 'SOL/USD': 0.72, 'XAUT/USD': 0.10 },
          'SOL/USD': { 'BTC/USD': 0.65, 'ETH/USD': 0.72, 'XAUT/USD': 0.05 },
        }),
      },
    });
    console.log('✅ Created correlation cache');
  } else {
    console.log('🔗 Correlation cache already exists for today');
  }

  // 6. Seed sentiment cache (sample)
  const existingSentiment = await prisma.sentimentCache.findFirst({
    where: {
      symbol: 'BTC',
      source: 'combined',
      date: today,
    },
  });

  if (!existingSentiment) {
    console.log('\n😐 Seeding market sentiment...');
    await prisma.sentimentCache.create({
      data: {
        symbol: 'BTC',
        source: 'combined',
        score: 0.65,
        period: '1d',
        date: new Date(),
        articles: JSON.stringify([
          { title: 'Bitcoin breaks $70K', sentiment: 0.8, source: 'news' },
          { title: 'ETH rallies', sentiment: 0.6, source: 'social' },
        ]),
      },
    });
    await prisma.sentimentCache.create({
      data: {
        symbol: 'ETH',
        source: 'combined',
        score: 0.58,
        period: '1d',
        date: new Date(),
        articles: JSON.stringify([]),
      },
    });
    console.log('✅ Created sentiment cache');
  } else {
    console.log('😐 Sentiment cache already exists for today');
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npx prisma generate (to update client)');
  console.log('   2. Test API endpoints: /api/trades, /api/performance, etc.');
  console.log('   3. Login with admin@trading-dashboard.com (password needs to be set)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
