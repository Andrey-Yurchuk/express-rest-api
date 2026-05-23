import 'reflect-metadata';

import { PrismaClient } from '@prisma/client';
import { container } from 'tsyringe';

import { prisma } from './db';

container.registerInstance(PrismaClient, prisma);

export { container };
