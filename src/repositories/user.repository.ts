import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface UserCredentials {
  id: string;
  passwordHash: string;
}

@injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findCredentials(id: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
  }

  async create(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.create({
      data: { id, passwordHash },
      select: { id: true },
    });
  }
}
