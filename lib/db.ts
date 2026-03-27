import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const resetTokensFile = path.join(dataDir, 'reset_tokens.json');

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // hashed, optional for OAuth users
  createdAt: string;
  email_verified: boolean;
  verification_token?: string;
  provider?: 'credentials' | 'google' | 'microsoft';
  provider_id?: string; // OAuth provider user ID
  subscription_tier: 'free' | 'pro' | 'trial';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  trial_ends_at?: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface ResetToken {
  token: string;
  userId: string;
  expiresAt: string;
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
}

// Users
export async function readUsers(): Promise<User[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(usersFile, 'utf-8');
    const users = JSON.parse(data);
    // Ensure backward compatibility: add defaults for missing fields
    return users.map((u: any) => ({
      ...u,
      subscription_tier: u.subscription_tier || 'free',
      subscription_status: u.subscription_status || 'active',
      stripe_customer_id: u.stripe_customer_id || null,
      stripe_subscription_id: u.stripe_subscription_id || null,
      current_period_end: u.current_period_end || null,
    }));
  } catch {
    return [];
  }
}

export async function writeUsers(users: User[]) {
  await ensureDataDir();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers();
  return users.find(u => u.email === email) || null;
}

export async function createUser(
  email: string, 
  name: string, 
  password?: string, 
  options?: { provider?: 'credentials' | 'google' | 'microsoft'; provider_id?: string }
): Promise<User> {
  const users = await readUsers();
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const newUser: User = {
    id,
    email,
    name,
    password: hashedPassword,
    createdAt: now.toISOString(),
    email_verified: options?.provider ? true : false, // OAuth users are auto-verified
    verification_token: options?.provider ? undefined : generateVerificationToken(),
    provider: options?.provider || 'credentials',
    provider_id: options?.provider_id,
    subscription_tier: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: trialEndsAt,
  };
  
  users.push(newUser);
  await writeUsers(users);
  return newUser;
}

// Sessions (simple in-memory file-based)
export async function readSessions(): Promise<Session[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(sessionsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeSessions(sessions: Session[]) {
  await ensureDataDir();
  await fs.writeFile(sessionsFile, JSON.stringify(sessions, null, 2));
}

export async function createSession(userId: string, expiresInHours = 24): Promise<Session> {
  // Stateless: only create JWT token, do not write to file
  const token = jwt.sign({ userId }, process.env.NEXTAUTH_SECRET || 'fallback-secret', { expiresIn: `${expiresInHours}h` });
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  return { token, userId, expiresAt };
}

export async function isValidSession(token: string): Promise<Session | null> {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
    if (!decoded || !decoded.userId) return null;
    // Reconstruct expiresAt from exp (seconds since epoch)
    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    // Optionally check if expired (jwt.verify already checks exp)
    return { token, userId: decoded.userId, expiresAt };
  } catch (err) {
    // Invalid signature, expired, etc.
    return null;
  }
}

export async function deleteSession(token: string) {
  // Stateless: nothing to delete
  // In a real app, you'd need a token blacklist or short expiry
  // For now, do nothing (client deletes cookie)
}

// Reset Tokens
export async function createResetToken(userId: string, expiresInMinutes = 60): Promise<string> {
  const tokens = await readResetTokens();
  const token = jwt.sign({ userId }, process.env.NEXTAUTH_SECRET || 'fallback-secret', { expiresIn: `${expiresInMinutes}m` });
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
  tokens.push({ token, userId, expiresAt });
  await writeResetTokens(tokens);
  return token;
}

export async function readResetTokens(): Promise<ResetToken[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(resetTokensFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeResetTokens(tokens: ResetToken[]) {
  await ensureDataDir();
  await fs.writeFile(resetTokensFile, JSON.stringify(tokens, null, 2));
}

export async function consumeResetToken(token: string): Promise<ResetToken | null> {
  const tokens = await readResetTokens();
  const index = tokens.findIndex(t => t.token === token);
  if (index === -1) return null;
  const resetToken = tokens[index];
  if (new Date(resetToken.expiresAt) < new Date()) {
    await writeResetTokens(tokens.filter(t => t.token !== token));
    return null;
  }
  // Remove after use (one-time)
  tokens.splice(index, 1);
  await writeResetTokens(tokens);
  return resetToken;
}

// Email Verification
export async function verifyUserEmail(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
    if (decoded.purpose !== 'email-verification') return null;
    
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.verification_token === token);
    if (userIndex === -1) return null;
    
    // Mark as verified, clear token
    users[userIndex].email_verified = true;
    users[userIndex].verification_token = undefined;
    await writeUsers(users);
    
    return users[userIndex];
  } catch {
    return null;
  }
}

export async function requestEmailVerification(userId: string): Promise<boolean> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.email_verified) return false;
  
  const token = generateVerificationToken();
  user.verification_token = token;
  await writeUsers(users);
  
  // Send verification email (handled in route)
  return true;
}

export async function findUserById(userId: string): Promise<User | null> {
  const users = await readUsers();
  return users.find(u => u.id === userId) || null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  await writeUsers(users);
  return users[userIndex];
}

// Subscription Management
export async function updateUserSubscription(
  userId: string,
  updates: Partial<Pick<User, 'subscription_tier' | 'subscription_status' | 'stripe_customer_id' | 'stripe_subscription_id' | 'current_period_end' | 'trial_ends_at'>>
): Promise<User | null> {
  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  await writeUsers(users);
  return users[userIndex];
}

export async function getUserSubscription(userId: string): Promise<{ tier: string; status: string; current_period_end?: string; trial_ends_at?: string } | null> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  return {
    tier: user.subscription_tier,
    status: user.subscription_status,
    current_period_end: user.current_period_end,
    trial_ends_at: user.trial_ends_at,
  };
}

export async function isProUser(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  const isPro = sub?.tier === 'pro' && sub?.status === 'active';
  const isActiveTrial = !!(sub?.tier === 'trial' && sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date());
  return isPro || isActiveTrial;
}

export async function checkAndExpireTrials(): Promise<void> {
  const users = await readUsers();
  const now = new Date();
  let changed = false;

  for (const user of users) {
    if (user.subscription_tier === 'trial' && user.trial_ends_at) {
      if (new Date(user.trial_ends_at) < now) {
        // Trial expired, downgrade to free
        user.subscription_tier = 'free';
        user.subscription_status = 'active';
        user.trial_ends_at = undefined;
        changed = true;
        console.log(`User ${user.id} trial expired, downgraded to free`);
      }
    }
  }

  if (changed) {
    await writeUsers(users);
  }
}