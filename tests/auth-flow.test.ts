import request from 'supertest';

import { closeTestResources, getApp } from './helpers/test-app';
import { cleanupTestUsers, TEST_PASSWORD, uniqueEmail } from './helpers/test-data';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const createdUserIds: string[] = [];

async function signup(id: string): Promise<TokenPair> {
  const response = await request(getApp())
    .post('/api/signup')
    .send({ id, password: TEST_PASSWORD });
  expect(response.status).toBe(201);
  expect(typeof response.body.accessToken).toBe('string');
  expect(typeof response.body.refreshToken).toBe('string');
  return response.body as TokenPair;
}

async function signin(id: string): Promise<TokenPair> {
  const response = await request(getApp())
    .post('/api/signin')
    .send({ id, password: TEST_PASSWORD });
  expect(response.status).toBe(200);
  return response.body as TokenPair;
}

afterAll(async () => {
  await cleanupTestUsers(createdUserIds);
  await closeTestResources();
});

describe('auth flow', () => {
  it('signup followed by /api/info returns the user id', async () => {
    const id = uniqueEmail();
    createdUserIds.push(id);

    const tokens = await signup(id);

    const info = await request(getApp())
      .get('/api/info')
      .set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(info.status).toBe(200);
    expect(info.body).toEqual({ id });
  });

  it('signin with wrong password returns 401', async () => {
    const id = uniqueEmail();
    createdUserIds.push(id);

    await signup(id);

    const response = await request(getApp())
      .post('/api/signin')
      .send({ id, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });

  it('refresh token rotation issues a new pair and rejects reuse of the old token', async () => {
    const id = uniqueEmail();
    createdUserIds.push(id);

    const initial = await signup(id);

    const refreshed = await request(getApp())
      .post('/api/signin/new_token')
      .send({ refreshToken: initial.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.accessToken).toBe('string');
    expect(typeof refreshed.body.refreshToken).toBe('string');
    expect(refreshed.body.refreshToken).not.toBe(initial.refreshToken);

    const reused = await request(getApp())
      .post('/api/signin/new_token')
      .send({ refreshToken: initial.refreshToken });
    expect(reused.status).toBe(401);
  });

  it('logout invalidates only the current session', async () => {
    const id = uniqueEmail();
    createdUserIds.push(id);

    await signup(id);
    const session1 = await signin(id);
    const session2 = await signin(id);

    const logout = await request(getApp())
      .get('/api/logout')
      .set('Authorization', `Bearer ${session1.accessToken}`);
    expect(logout.status).toBe(200);

    const info1 = await request(getApp())
      .get('/api/info')
      .set('Authorization', `Bearer ${session1.accessToken}`);
    expect(info1.status).toBe(401);

    const info2 = await request(getApp())
      .get('/api/info')
      .set('Authorization', `Bearer ${session2.accessToken}`);
    expect(info2.status).toBe(200);
    expect(info2.body).toEqual({ id });

    const refresh1 = await request(getApp())
      .post('/api/signin/new_token')
      .send({ refreshToken: session1.refreshToken });
    expect(refresh1.status).toBe(401);

    const refresh2 = await request(getApp())
      .post('/api/signin/new_token')
      .send({ refreshToken: session2.refreshToken });
    expect(refresh2.status).toBe(200);
  });
});
