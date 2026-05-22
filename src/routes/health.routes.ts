import { Router } from 'express';
import { container } from 'tsyringe';

import { HealthController } from '../controllers/health.controller';

export function createHealthRouter(): Router {
  const router = Router();
  const controller = container.resolve(HealthController);

  router.get('/', (req, res) => {
    controller.getHealth(req, res);
  });

  return router;
}
