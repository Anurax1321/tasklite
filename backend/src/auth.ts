import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';
const rawSecret = process.env.JWT_SECRET;

if (isProd && (!rawSecret || rawSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set to a strong value (>=32 chars) in production');
}

const JWT_SECRET = rawSecret || 'dev-only-insecure-secret-change-me';
const TOKEN_TTL = '7d';

if (!rawSecret) {
  // eslint-disable-next-line no-console
  console.warn('[auth] JWT_SECRET not set, using dev fallback. Do not deploy this.');
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = 'tasklite_token';
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
