import { Express } from 'express';

import { createApp } from '../../src/app';
import { prisma } from '../../src/db';

let cachedApp: Express | null = null;

export function getApp(): Express {
  if (!cachedApp) {
    cachedApp = createApp();
  }
  return cachedApp;
}

export async function closeTestResources(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
