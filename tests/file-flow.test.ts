import fs from 'fs';
import path from 'path';
import request from 'supertest';

import { getUploadDir } from '../src/middleware/upload.middleware';
import { closeTestResources, getApp } from './helpers/test-app';
import { cleanupTestUsers, TEST_PASSWORD, uniqueEmail } from './helpers/test-data';

interface FileMetadata {
  id: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  storedName: string;
  uploadedAt: string;
  updatedAt: string;
}

const createdUserIds: string[] = [];

let userId: string;
let accessToken: string;

async function uploadFile(
  content: Buffer,
  filename: string,
  contentType = 'text/plain',
): Promise<FileMetadata> {
  const response = await request(getApp())
    .post('/api/file/upload')
    .set('Authorization', `Bearer ${accessToken}`)
    .attach('file', content, { filename, contentType });
  expect(response.status).toBe(201);
  return response.body as FileMetadata;
}

beforeAll(async () => {
  userId = uniqueEmail();
  createdUserIds.push(userId);

  const response = await request(getApp())
    .post('/api/signup')
    .send({ id: userId, password: TEST_PASSWORD });
  expect(response.status).toBe(201);
  accessToken = response.body.accessToken as string;
});

afterAll(async () => {
  await cleanupTestUsers(createdUserIds);
  await fs.promises.rm(getUploadDir(), { recursive: true, force: true });
  await closeTestResources();
});

describe('file flow', () => {
  it('upload requires authentication', async () => {
    const response = await request(getApp())
      .post('/api/file/upload')
      .attach('file', Buffer.from('content'), {
        filename: 'unauth.txt',
        contentType: 'text/plain',
      });
    expect(response.status).toBe(401);
  });

  it('upload stores metadata and writes the file to the upload directory', async () => {
    const content = Buffer.from('hello upload');
    const metadata = await uploadFile(content, 'hello.txt');

    expect(typeof metadata.id).toBe('string');
    expect(metadata.originalName).toBe('hello.txt');
    expect(metadata.extension).toBe('.txt');
    expect(metadata.mimeType).toBe('text/plain');
    expect(metadata.size).toBe(content.length);
    expect(typeof metadata.storedName).toBe('string');
    expect(metadata.storedName.length).toBeGreaterThan(0);
    expect(typeof metadata.uploadedAt).toBe('string');
    expect(typeof metadata.updatedAt).toBe('string');

    const storedPath = path.join(getUploadDir(), metadata.storedName);
    expect(fs.existsSync(storedPath)).toBe(true);
    expect(fs.readFileSync(storedPath)).toEqual(content);
  });

  it('list pagination respects list_size and rejects list_size=0', async () => {
    for (let i = 0; i < 3; i++) {
      await uploadFile(Buffer.from(`page-${i}`), `page-${i}.txt`);
    }

    const ok = await request(getApp())
      .get('/api/file/list?list_size=2&page=1')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body.items)).toBe(true);
    expect(ok.body.items.length).toBeLessThanOrEqual(2);
    expect(ok.body.page).toBe(1);
    expect(ok.body.listSize).toBe(2);

    const bad = await request(getApp())
      .get('/api/file/list?list_size=0&page=1')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(bad.status).toBe(400);
  });

  it('returns metadata for an existing file and 404 for a missing id', async () => {
    const metadata = await uploadFile(Buffer.from('meta'), 'meta.txt');

    const found = await request(getApp())
      .get(`/api/file/${metadata.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(found.status).toBe(200);
    expect(found.body.id).toBe(metadata.id);
    expect(found.body.originalName).toBe('meta.txt');
    expect(found.body.storedName).toBe(metadata.storedName);

    const missing = await request(getApp())
      .get('/api/file/non-existing-id')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(missing.status).toBe(404);
  });

  it('download returns the file content with attachment Content-Disposition', async () => {
    const content = Buffer.from('download-me');
    const metadata = await uploadFile(content, 'download.txt');

    const response = await request(getApp())
      .get(`/api/file/download/${metadata.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
        res.on('error', (err) => callback(err, Buffer.alloc(0)));
      });

    expect(response.status).toBe(200);
    const disposition = response.headers['content-disposition'];
    expect(typeof disposition).toBe('string');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('download.txt');
    expect(response.body).toEqual(content);
  });

  it('update replaces the stored file and updates metadata', async () => {
    const original = Buffer.from('original-content');
    const initial = await uploadFile(original, 'old.txt');
    const oldStoredPath = path.join(getUploadDir(), initial.storedName);

    const replacement = Buffer.from('replacement-content!');
    const updated = await request(getApp())
      .put(`/api/file/update/${initial.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', replacement, { filename: 'new.md', contentType: 'text/markdown' });

    expect(updated.status).toBe(200);
    expect(updated.body.id).toBe(initial.id);
    expect(updated.body.originalName).toBe('new.md');
    expect(updated.body.extension).toBe('.md');
    expect(updated.body.mimeType).toBe('text/markdown');
    expect(updated.body.size).toBe(replacement.length);
    expect(updated.body.storedName).not.toBe(initial.storedName);

    const newStoredPath = path.join(getUploadDir(), updated.body.storedName as string);
    expect(fs.existsSync(newStoredPath)).toBe(true);
    expect(fs.readFileSync(newStoredPath)).toEqual(replacement);
    expect(fs.existsSync(oldStoredPath)).toBe(false);
  });

  it('delete removes the DB record and the stored file', async () => {
    const metadata = await uploadFile(Buffer.from('to-delete'), 'delete.txt');
    const storedPath = path.join(getUploadDir(), metadata.storedName);
    expect(fs.existsSync(storedPath)).toBe(true);

    const response = await request(getApp())
      .delete(`/api/file/delete/${metadata.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(response.status).toBe(200);

    const missing = await request(getApp())
      .get(`/api/file/${metadata.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(missing.status).toBe(404);
    expect(fs.existsSync(storedPath)).toBe(false);
  });
});
