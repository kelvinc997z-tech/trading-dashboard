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
