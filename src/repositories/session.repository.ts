import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CreateSessionInput {
  id: string;
  userId: string;
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
}
