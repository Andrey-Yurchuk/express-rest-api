import crypto from 'crypto';

import { prisma } from '../../src/db';

export const TEST_PASSWORD = 'TestPassword123';

export function uniqueEmail(prefix = 'test'): string {
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${Date.now()}-${random}@example.test`;
}

export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  await prisma.file.deleteMany({
    where: {
      OR: [{ uploadedById: { in: userIds } }, { updatedById: { in: userIds } }],
    },
  });
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
