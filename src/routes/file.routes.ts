import { Router } from 'express';
import { container } from 'tsyringe';

import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createUploader } from '../middleware/upload.middleware';

export function createFileRouter(): Router {
  const router = Router();
  const controller = container.resolve(FileController);
  const upload = createUploader();

  router.post('/upload', authMiddleware, upload.single('file'), (req, res, next) => {
    controller.upload(req, res).catch(next);
  });

  return router;
}
