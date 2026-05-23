import fs from 'fs/promises';
import path from 'path';
import { injectable } from 'tsyringe';

import { HttpError } from '../errors/http-error';
import { getUploadDir } from '../middleware/upload.middleware';
import { FileMetadata, FileRepository } from '../repositories/file.repository';

export interface UploadFileInput {
  uploadedById: string;
  originalName: string;
  mimeType: string;
  size: number;
  storedName: string;
}

export interface ListFilesInput {
  page: number;
  listSize: number;
}

export interface ListFilesResult {
  items: FileMetadata[];
  page: number;
  listSize: number;
}

@injectable()
export class FileService {
  constructor(private readonly files: FileRepository) {}

  async upload(input: UploadFileInput): Promise<FileMetadata> {
    const originalName = path.basename(input.originalName);
    const extension = path.extname(originalName);

    try {
      return await this.files.create({
        uploadedById: input.uploadedById,
        originalName,
        extension,
        mimeType: input.mimeType,
        size: input.size,
        storedName: input.storedName,
      });
    } catch (error) {
      await this.removeStoredFile(input.storedName);
      throw error;
    }
  }

  async list(input: ListFilesInput): Promise<ListFilesResult> {
    const { page, listSize } = input;
    const items = await this.files.findMany({
      skip: (page - 1) * listSize,
      take: listSize,
    });
    return { items, page, listSize };
  }

  async getById(id: string): Promise<FileMetadata> {
    const file = await this.files.findById(id);
    if (!file) {
      throw new HttpError(404, 'File not found');
    }
    return file;
  }

  private async removeStoredFile(storedName: string): Promise<void> {
    try {
      await fs.unlink(path.join(getUploadDir(), storedName));
    } catch (cleanupError) {
      console.warn('Failed to clean up stored file after DB error', {
        storedName,
        error: cleanupError,
      });
    }
  }
}
