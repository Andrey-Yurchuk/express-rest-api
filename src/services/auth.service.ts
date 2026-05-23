import crypto from 'crypto';
import { injectable } from 'tsyringe';

import { HttpError } from '../errors/http-error';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import { isValidId } from '../utils/id-validation';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  getRefreshTtlSeconds,
  hashRefreshToken,
  safeEqualHex,
  signAccessToken,
  signRefreshToken,
  TokenPayload,
  verifyRefreshToken,
} from '../utils/tokens';

export interface AuthCredentials {
  id: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async signup(credentials: AuthCredentials): Promise<AuthTokens> {
    this.validateCredentials(credentials);

    const existing = await this.users.findCredentials(credentials.id);
    if (existing) {
      throw new HttpError(409, 'User already exists');
    }

    const passwordHash = await hashPassword(credentials.password);
    await this.users.create(credentials.id, passwordHash);

    return this.createSessionTokens(credentials.id);
  }

  async signin(credentials: AuthCredentials): Promise<AuthTokens> {
    this.validateCredentials(credentials);

    const user = await this.users.findCredentials(credentials.id);
    if (!user) {
      throw new HttpError(401, 'Invalid id or password');
    }

    const passwordMatches = await verifyPassword(credentials.password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid id or password');
    }

    return this.createSessionTokens(user.id);
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessions.revokeById(sessionId);
  }

  async refreshTokens(refreshToken: unknown): Promise<AuthTokens> {
    if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      throw new HttpError(400, 'Refresh token is required');
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new HttpError(401, 'Invalid refresh token');
    }

    const session = await this.sessions.findById(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw new HttpError(401, 'Invalid refresh token');
    }
    if (session.revoked) {
      throw new HttpError(401, 'Refresh token is revoked');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new HttpError(401, 'Refresh token is expired');
    }

    const incomingHash = hashRefreshToken(refreshToken);
    if (!safeEqualHex(incomingHash, session.refreshTokenHash)) {
      throw new HttpError(401, 'Invalid refresh token');
    }

    return this.rotateSessionTokens({ sub: session.userId, sid: session.id });
  }

  private validateCredentials(credentials: AuthCredentials): void {
    if (typeof credentials.id !== 'string' || credentials.id.trim() === '') {
      throw new HttpError(400, 'Id is required');
    }
    if (typeof credentials.password !== 'string' || credentials.password.length === 0) {
      throw new HttpError(400, 'Password is required');
    }
    if (!isValidId(credentials.id)) {
      throw new HttpError(400, 'Id must be a valid email or phone number');
    }
  }

  private async createSessionTokens(userId: string): Promise<AuthTokens> {
    const sessionId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ sub: userId, sid: sessionId });
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + getRefreshTtlSeconds() * 1000);

    await this.sessions.create({
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
    });

    const accessToken = signAccessToken({ sub: userId, sid: sessionId });
    return { accessToken, refreshToken };
  }

  private async rotateSessionTokens(payload: TokenPayload): Promise<AuthTokens> {
    const refreshToken = signRefreshToken(payload);
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + getRefreshTtlSeconds() * 1000);

    await this.sessions.rotateRefreshToken({
      id: payload.sid,
      refreshTokenHash,
      expiresAt,
    });

    const accessToken = signAccessToken(payload);
    return { accessToken, refreshToken };
  }
}
