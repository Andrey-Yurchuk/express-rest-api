import { Router } from 'express';
import { container } from 'tsyringe';

import { AuthController } from '../controllers/auth.controller';

export function createAuthRouter(): Router {
  const router = Router();
  const controller = container.resolve(AuthController);

  router.post('/signup', (req, res, next) => {
    controller.signup(req, res).catch(next);
  });

  router.post('/signin', (req, res, next) => {
    controller.signin(req, res).catch(next);
  });

  router.post('/signin/new_token', (req, res, next) => {
    controller.refreshToken(req, res).catch(next);
  });

  return router;
}
