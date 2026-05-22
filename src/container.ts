import 'reflect-metadata';

import { container } from 'tsyringe';

import { prisma } from './db';

container.registerInstance('PrismaClient', prisma);

export { container };
