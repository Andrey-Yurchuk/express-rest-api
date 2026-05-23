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

export interface UpdateFileInput {
  id: string;
  updatedById: string;
  originalName: string;
  mimeType: string;
  size: number;
  storedName: string;
}

export interface PreparedDownload {
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
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

  async prepareDownload(id: string): Promise<PreparedDownload> {
    const file = await this.files.findById(id);
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    const filePath = path.join(getUploadDir(), file.storedName);
    try {
      await fs.access(filePath);
    } catch {
      throw new HttpError(404, 'Stored file not found');
    }

    return {
      filePath,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  async update(input: UpdateFileInput): Promise<FileMetadata> {
    const existing = await this.files.findById(input.id);
    if (!existing) {
      await this.removeStoredFile(input.storedName);
      throw new HttpError(404, 'File not found');
    }

    const originalName = path.basename(input.originalName);
    const extension = path.extname(originalName);

    let updated: FileMetadata;
    try {
      updated = await this.files.update(input.id, {
        updatedById: input.updatedById,
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

    await this.removeStoredFile(existing.storedName);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.files.findById(id);
    if (!existing) {
      throw new HttpError(404, 'File not found');
    }

    await this.files.delete(id);
    await this.removeStoredFile(existing.storedName);
  }

  private async removeStoredFile(storedName: string): Promise<void> {
    const filePath = path.join(getUploadDir(), storedName);
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      if (this.isFileNotFoundError(cleanupError)) {
        return;
      }
      console.warn('Failed to remove stored file', {
        storedName,
        error: cleanupError,
      });
    }
  }

  private isFileNotFoundError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    const code = (error as { code?: unknown }).code;
    return code === 'ENOENT';
  }
}
