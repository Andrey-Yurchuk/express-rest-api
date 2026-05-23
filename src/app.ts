import './container';

import cors from 'cors';
import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/error-handler.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { createAuthRouter } from './routes/auth.routes';
import { createFileRouter } from './routes/file.routes';
import { createHealthRouter } from './routes/health.routes';
import { swaggerSpec } from './swagger';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', createHealthRouter());
  app.use('/api', createAuthRouter());
  app.use('/api/file', createFileRouter());

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
