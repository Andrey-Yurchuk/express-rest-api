import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { HttpError } from '../errors/http-error';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { FileService } from '../services/file.service';

@injectable()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  async upload(req: Request, res: Response): Promise<void> {
    const file = req.file;
    if (!file) {
      throw new HttpError(400, 'File is required');
    }

    const { userId } = (req as AuthenticatedRequest).auth;
    const metadata = await this.fileService.upload({
      uploadedById: userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storedName: file.filename,
    });

    res.status(201).json(metadata);
  }
}
