import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DB seed...');
  const email = 'test@trading.com';
  const name = 'Test User';
  const password = 'Test123!';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✅ User ${email} already exists (id: ${existing.id})`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        email_verified: true,
        provider: 'credentials',
        subscription_tier: 'trial',
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt,
        createdAt: now,
      },
    });

    console.log(`✅ Created test user: ${email} / ${password} (id: ${user.id})`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });