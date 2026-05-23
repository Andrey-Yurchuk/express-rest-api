import { Router } from 'express';
import { container } from 'tsyringe';

import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

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

  router.get('/info', authMiddleware, (req, res, next) => {
    try {
      controller.info(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get('/logout', authMiddleware, (req, res, next) => {
    controller.logout(req, res).catch(next);
  });

  return router;
}
