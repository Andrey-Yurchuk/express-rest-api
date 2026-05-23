import crypto from 'crypto';
import fs from 'fs';
import multer, { Multer } from 'multer';
import path from 'path';

const DEFAULT_UPLOAD_DIR = 'uploads';
const DEFAULT_MAX_UPLOAD_SIZE_MB = 50;

export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

export function getMaxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_SIZE_MB;
  const parsed = Number(raw);
  const mb = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_SIZE_MB;
  return Math.floor(mb * 1024 * 1024);
}

function ensureUploadDir(uploadDir: string): void {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export function createUploader(): Multer {
  const uploadDir = getUploadDir();
  ensureUploadDir(uploadDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname);
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: getMaxUploadBytes() },
  });
}
