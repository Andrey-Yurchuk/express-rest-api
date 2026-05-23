import './container';

import cors from 'cors';
import express, { Express } from 'express';

import { errorHandler } from './middleware/error-handler.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { createAuthRouter } from './routes/auth.routes';
import { createHealthRouter } from './routes/health.routes';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', createHealthRouter());
  app.use('/api', createAuthRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
