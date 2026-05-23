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

export interface UpdateFileInput {
  updatedById: string;
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
  updatedAt: Date;
}

export interface FindManyFilesOptions {
  skip: number;
  take: number;
}

const FILE_METADATA_SELECT = {
  id: true,
  originalName: true,
  extension: true,
  mimeType: true,
  size: true,
  storedName: true,
  uploadedAt: true,
  updatedAt: true,
} as const;

@injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateFileInput): Promise<FileMetadata> {
    return this.prisma.file.create({
      data: input,
      select: FILE_METADATA_SELECT,
    });
  }

  findMany(options: FindManyFilesOptions): Promise<FileMetadata[]> {
    return this.prisma.file.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: [{ uploadedAt: 'desc' }, { id: 'desc' }],
      select: FILE_METADATA_SELECT,
    });
  }

  findById(id: string): Promise<FileMetadata | null> {
    return this.prisma.file.findUnique({
      where: { id },
      select: FILE_METADATA_SELECT,
    });
  }

  update(id: string, data: UpdateFileInput): Promise<FileMetadata> {
    return this.prisma.file.update({
      where: { id },
      data,
      select: FILE_METADATA_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }
}
