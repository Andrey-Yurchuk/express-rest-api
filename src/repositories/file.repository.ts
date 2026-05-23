import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface CreateFileInput {
  uploadedById: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  storedName: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  storedName: string;
  uploadedAt: Date;
}

@injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateFileInput): Promise<FileMetadata> {
    return this.prisma.file.create({
      data: input,
      select: {
        id: true,
        originalName: true,
        extension: true,
        mimeType: true,
        size: true,
        storedName: true,
        uploadedAt: true,
      },
    });
  }
}
