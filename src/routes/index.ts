import { Router } from 'express';

import { createHealthRouter } from './health.routes';

export function createApiRouter(): Router {
  const router = Router();

  router.use('/health', createHealthRouter());

  return router;
}
