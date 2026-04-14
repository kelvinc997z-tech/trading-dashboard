import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.marketSignal.count();
    console.log(`Current signals in DB: ${count}`);
    const latest = await prisma.marketSignal.findMany({
      take: 5,
      orderBy: { generatedAt: 'desc' }
    });
    console.log("Latest signals:", JSON.stringify(latest, null, 2));
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
