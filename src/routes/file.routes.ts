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

  router.get('/list', authMiddleware, (req, res, next) => {
    controller.list(req, res).catch(next);
  });

  router.get('/download/:id', authMiddleware, (req, res, next) => {
    controller.download(req, res, next).catch(next);
  });

  router.put('/update/:id', authMiddleware, upload.single('file'), (req, res, next) => {
    controller.update(req, res).catch(next);
  });

  router.delete('/delete/:id', authMiddleware, (req, res, next) => {
    controller.delete(req, res).catch(next);
  });

  router.get('/:id', authMiddleware, (req, res, next) => {
    controller.getById(req, res).catch(next);
  });

  return router;
}
