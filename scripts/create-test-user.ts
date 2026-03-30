import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function createTestUser(email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`❌ User ${email} already exists`);
    process.exit(1);
  }
  await db.user.create({
    data: {
      email,
      password: hashed,
      verified: true, // test account always verified
    },
  });
  console.log(`✅ Created test user:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  await db.$disconnect();
}

const email = process.argv[2];
const password = process.argv[3] || "password123";

if (!email) {
  console.error("Usage: npx tsx scripts/create-test-user.ts <email> [password]");
  process.exit(1);
}

createTestUser(email, password);
