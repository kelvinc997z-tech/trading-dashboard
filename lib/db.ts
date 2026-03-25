import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const resetTokensFile = path.join(dataDir, 'reset_tokens.json');

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  createdAt: string;
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
    return JSON.parse(data);
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

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const users = await readUsers();
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id,
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
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