// Script to create a test user in data/users.json
const { promises: fs } = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

async function ensureAndReadUsers() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
  try {
    const data = await fs.readFile(usersFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}

async function createTestUser() {
  const users = await ensureAndReadUsers();

  // Remove any existing test user with the same email
  const email = 'test@trading.com';
  const idx = users.findIndex(u => u.email === email);
  if (idx !== -1) users.splice(idx, 1);

  const password = 'Test123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newUser = {
    id: 'user_test_' + Date.now(),
    email,
    name: 'Test User',
    password: hashedPassword,
    createdAt: now,
    email_verified: true,
    provider: 'credentials',
    subscription_tier: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: trialEndsAt,
  };

  users.push(newUser);
  await writeUsers(users);
  console.log(`Created test user: ${email} / ${password}`);
}

createTestUser().catch(console.error);
