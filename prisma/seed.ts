import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user: admin@test.com / password123
  const hashedPassword = await import('bcryptjs').then(mod => mod.hash('password123', 10));
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      verified: true, // Test account bypass verification
      verificationToken: null,
    },
  });
  
  console.log('Seeded test user:', user.email);

  // Check if user already has trades to avoid duplicates
  const existingTrades = await prisma.trade.count({ where: { userId: user.id } });
  if (existingTrades === 0) {
    // Create sample trades
    const now = new Date();
    const symbols = ['BTC', 'ETH', 'XAUT', 'SOL', 'XRP'];
    const sides = ['buy', 'sell'];

    for (let i = 0; i < 10; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const entry = Math.random() * 10000 + 100;
      const size = Math.random() * 2 + 0.1;
      const daysAgo = Math.floor(Math.random() * 7);
      const tradeDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Randomly close some trades
      const isClosed = Math.random() > 0.5;
      let pnl, pnlPct, exit, exitDate;

      if (isClosed) {
        const outcome = Math.random() > 0.5 ? 1 : -1; // win or loss
        const pnlValue = outcome * Math.random() * 500;
        pnl = pnlValue;
        pnlPct = (pnlValue / (entry * size)) * 100;
        exit = entry + (pnlValue / size);
        exitDate = new Date(tradeDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      }

      await prisma.trade.create({
        data: {
          userId: user.id,
          symbol,
          side,
          entry: Number(entry.toFixed(2)),
          size: Number(size.toFixed(4)),
          stopLoss: Number((entry * 0.95).toFixed(2)),
          takeProfit: Number((entry * 1.1).toFixed(2)),
          pnl: pnl ? Number(pnl.toFixed(2)) : null,
          pnlPct: pnlPct ? Number(pnlPct.toFixed(2)) : null,
          status: isClosed ? 'closed' : 'open',
          date: tradeDate,
          exit: exit ? Number(exit.toFixed(2)) : null,
          exitDate: exitDate || null,
        },
      });
    }

    console.log('✅ Created 10 sample trades');
  } else {
    console.log('ℹ️  Trades already exist, skipping sample data');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
