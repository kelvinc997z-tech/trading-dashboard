const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Try to find a user and select walletAddress to see if column exists
    const user = await prisma.user.findFirst({
      select: { walletAddress: true }
    });
    console.log('walletAddress column exists:', user !== null);
  } catch (e) {
    console.error('Error checking column:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();