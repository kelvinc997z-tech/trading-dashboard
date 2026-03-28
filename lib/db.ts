import { prisma } from './prisma';
import type { User, ResetToken } from '@prisma/client';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

// Users
export async function readUsers(): Promise<User[]> {
  return prisma.user.findMany();
}

export async function writeUsers(_users: User[]): Promise<void> {
  throw new Error('writeUsers not used with Prisma');
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(
  email: string,
  name: string,
  password?: string,
  options?: { provider?: 'credentials' | 'google' | 'microsoft'; provider_id?: string }
): Promise<User> {
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      createdAt: now,
      email_verified: !!options?.provider,
      verification_token: options?.provider ? undefined : generateVerificationToken(),
      provider: options?.provider ?? 'credentials',
      provider_id: options?.provider_id,
      subscription_tier: 'trial',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt,
    },
  });
  return user;
}

// Sessions
export async function readSessions(): Promise<Session[]> {
  return [];
}

export async function writeSessions(_sessions: Session[]): Promise<void> {
  // noop
}

export async function createSession(userId: string, expiresInHours = 24): Promise<Session> {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback';
  const token = jwt.sign({ userId }, secret, { expiresIn: `${expiresInHours}h` });
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  return { token, userId, expiresAt };
}

export async function isValidSession(token: string): Promise<Session | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback';
    const decoded = jwt.verify(token, secret) as any;
    if (!decoded?.userId) return null;
    const expiresAt = new Date(decoded.exp * 1000).toISOString();
    return { token, userId: decoded.userId, expiresAt };
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  // stateless
}

// Reset Tokens
export async function createResetToken(userId: string, expiresInMinutes = 60): Promise<string> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const token = jwt.sign({ userId }, process.env.NEXTAUTH_SECRET || 'fallback', { expiresIn: `${expiresInMinutes}m` });
  await prisma.resetToken.create({
    data: { token, user: { connect: { id: userId } }, expiresAt },
  });
  return token;
}

export async function readResetTokens(): Promise<ResetToken[]> {
  return prisma.resetToken.findMany({ include: { user: true } });
}

export async function writeResetTokens(_tokens: ResetToken[]): Promise<void> {
  // noop
}

export async function consumeResetToken(token: string): Promise<ResetToken | null> {
  const rt = await prisma.resetToken.findUnique({ where: { token }, include: { user: true } });
  if (!rt) return null;
  if (rt.expiresAt < new Date()) {
    await prisma.resetToken.delete({ where: { token } });
    return null;
  }
  await prisma.resetToken.delete({ where: { token } });
  return rt;
}

// Email verification
export async function verifyUserEmail(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback') as any;
    if (decoded.purpose !== 'email-verification') return null;
    const user = await prisma.user.findUnique({ where: { verification_token: token } });
    if (!user) return null;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email_verified: true, verification_token: null },
    });
    return updated;
  } catch {
    return null;
  }
}

export async function requestEmailVerification(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email_verified) return false;
  const token = generateVerificationToken();
  await prisma.user.update({ where: { id: userId }, data: { verification_token: token } });
  return true;
}

// generic user queries
export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const data: any = updates;
  if (data.password === undefined) delete data.password;
  if (data.verification_token === undefined) delete data.verification_token;
  if (data.provider_id === undefined) delete data.provider_id;
  if (data.stripe_customer_id === undefined) delete data.stripe_customer_id;
  if (data.stripe_subscription_id === undefined) delete data.stripe_subscription_id;
  if (data.current_period_end === undefined) delete data.current_period_end;
  if (data.trial_ends_at === undefined) delete data.trial_ends_at;
  try {
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return updated;
  } catch {
    return null;
  }
}

// Subscription
export async function updateUserSubscription(
  userId: string,
  updates: Partial<Pick<User, 'subscription_tier' | 'subscription_status' | 'stripe_customer_id' | 'stripe_subscription_id' | 'current_period_end' | 'trial_ends_at'>>
): Promise<User | null> {
  const data: any = updates;
  if (data.stripe_customer_id === undefined) delete data.stripe_customer_id;
  if (data.stripe_subscription_id === undefined) delete data.stripe_subscription_id;
  if (data.current_period_end === undefined) delete data.current_period_end;
  if (data.trial_ends_at === undefined) delete data.trial_ends_at;
  try {
    const updated = await prisma.user.update({ where: { id: userId }, data });
    return updated;
  } catch {
    return null;
  }
}

export async function getUserSubscription(userId: string): Promise<{ tier: string; status: string; current_period_end?: string; trial_ends_at?: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription_tier: true, subscription_status: true, current_period_end: true, trial_ends_at: true },
  });
  if (!user) return null;
  return {
    tier: user.subscription_tier,
    status: user.subscription_status,
    current_period_end: user.current_period_end?.toISOString(),
    trial_ends_at: user.trial_ends_at?.toISOString(),
  };
}

export async function isProUser(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  const isPro = sub?.tier === 'pro' && sub?.status === 'active';
  const isActiveTrial = !!(sub?.tier === 'trial' && sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date());
  return isPro || isActiveTrial;
}

export async function checkAndExpireTrials(): Promise<void> {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      subscription_tier: 'trial',
      trial_ends_at: { lt: now },
    },
  });
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_tier: 'free',
        subscription_status: 'active',
        trial_ends_at: null,
      },
    });
  }
}

export function prismaUserToUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
    email_verified: user.email_verified,
    verification_token: user.verification_token,
    provider: user.provider,
    provider_id: user.provider_id,
    subscription_tier: user.subscription_tier,
    subscription_status: user.subscription_status,
    stripe_customer_id: user.stripe_customer_id,
    stripe_subscription_id: user.stripe_subscription_id,
    current_period_end: user.current_period_end?.toISOString(),
    trial_ends_at: user.trial_ends_at?.toISOString(),
  };
}