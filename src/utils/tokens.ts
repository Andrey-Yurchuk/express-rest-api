import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

const DEFAULT_ACCESS_TTL_SECONDS = 600;
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface TokenPayload {
  sub: string;
  sid: string;
}

function readTtlSeconds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

export function getAccessTtlSeconds(): number {
  return readTtlSeconds(process.env.JWT_ACCESS_TTL, DEFAULT_ACCESS_TTL_SECONDS);
}

export function getRefreshTtlSeconds(): number {
  return readTtlSeconds(process.env.JWT_REFRESH_TTL, DEFAULT_REFRESH_TTL_SECONDS);
}

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: getAccessTtlSeconds() };
  return jwt.sign(payload, readSecret('JWT_ACCESS_SECRET'), options);
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: getRefreshTtlSeconds(),
    jwtid: crypto.randomUUID(),
  };
  return jwt.sign(payload, readSecret('JWT_REFRESH_SECRET'), options);
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function safeEqualHex(incomingHash: string, storedHash: string): boolean {
  if (incomingHash.length !== storedHash.length) {
    return false;
  }

  const incomingBuffer = Buffer.from(incomingHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (incomingBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(incomingBuffer, storedBuffer);
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  return verifyTokenWithSecret(token, 'JWT_REFRESH_SECRET');
}

export function verifyAccessToken(token: string): TokenPayload | null {
  return verifyTokenWithSecret(token, 'JWT_ACCESS_SECRET');
}

function verifyTokenWithSecret(token: string, secretName: string): TokenPayload | null {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, readSecret(secretName));
  } catch {
    return null;
  }

  if (typeof decoded !== 'object' || decoded === null) {
    return null;
  }

  const sub = (decoded as { sub?: unknown }).sub;
  const sid = (decoded as { sid?: unknown }).sid;
  if (typeof sub !== 'string' || typeof sid !== 'string') {
    return null;
  }

  return { sub, sid };
}
