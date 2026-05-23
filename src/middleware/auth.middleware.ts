import { NextFunction, Request, RequestHandler, Response } from 'express';
import { container } from 'tsyringe';

import { HttpError } from '../errors/http-error';
import { SessionRepository } from '../repositories/session.repository';
import { verifyAccessToken } from '../utils/tokens';

const BEARER_PREFIX = 'Bearer ';

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export const authMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  authenticate(req)
    .then(() => next())
    .catch(next);
};

async function authenticate(req: Request): Promise<void> {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
    throw new HttpError(401, 'Unauthorized');
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (token === '') {
    throw new HttpError(401, 'Unauthorized');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new HttpError(401, 'Unauthorized');
  }

  const sessions = container.resolve(SessionRepository);
  const session = await sessions.findById(payload.sid);
  if (!session || session.userId !== payload.sub || session.revoked) {
    throw new HttpError(401, 'Unauthorized');
  }

  (req as AuthenticatedRequest).auth = {
    userId: payload.sub,
    sessionId: payload.sid,
  };
}
