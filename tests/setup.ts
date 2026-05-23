import 'reflect-metadata';
import 'dotenv/config';

import path from 'path';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? '600';
process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL ?? '604800';

process.env.UPLOAD_DIR =
  process.env.TEST_UPLOAD_DIR ?? path.resolve(process.cwd(), 'tests/tmp/uploads-test');
