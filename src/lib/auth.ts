import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateEmbedCode(): string {
  return crypto.randomUUID();
}

export function generateCuid(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 25);
}
