import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CreateSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  revoked: boolean;
  expiresAt: Date;
}

export interface RotateSessionInput {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

@injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateSessionInput): Promise<void> {
    await this.prisma.session.create({
      data: input,
      select: { id: true },
    });
  }

  findById(id: string): Promise<SessionRecord | null> {
    return this.prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        revoked: true,
        expiresAt: true,
      },
    });
  }

  async rotateRefreshToken(input: RotateSessionInput): Promise<void> {
    await this.prisma.session.update({
      where: { id: input.id },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
  }
}
