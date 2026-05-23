import { NextFunction, Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { HttpError } from '../errors/http-error';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { FileService } from '../services/file.service';
import { getDefaultListSize, getDefaultPage, parsePositiveInt } from '../utils/pagination';

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

  async list(req: Request, res: Response): Promise<void> {
    const page = parsePositiveInt(req.query.page, getDefaultPage());
    const listSize = parsePositiveInt(req.query.list_size, getDefaultListSize());

    const result = await this.fileService.list({ page, listSize });
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = this.requireIdParam(req);
    const file = await this.fileService.getById(id);
    res.status(200).json(file);
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    const id = this.requireIdParam(req);
    const download = await this.fileService.prepareDownload(id);

    res.download(download.filePath, download.originalName, (err) => {
      if (err) {
        next(err);
      }
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = this.requireIdParam(req);
    const file = req.file;
    if (!file) {
      throw new HttpError(400, 'File is required');
    }

    const { userId } = (req as AuthenticatedRequest).auth;
    const metadata = await this.fileService.update({
      id,
      updatedById: userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storedName: file.filename,
    });

    res.status(200).json(metadata);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const id = this.requireIdParam(req);
    await this.fileService.delete(id);
    res.status(200).json({ message: 'File deleted' });
  }

  private requireIdParam(req: Request): string {
    const id = req.params.id;
    if (typeof id !== 'string' || id === '') {
      throw new HttpError(400, 'Invalid file id');
    }
    return id;
  }
}
