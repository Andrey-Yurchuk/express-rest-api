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
  const options: SignOptions = { expiresIn: getRefreshTtlSeconds() };
  return jwt.sign(payload, readSecret('JWT_REFRESH_SECRET'), options);
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
