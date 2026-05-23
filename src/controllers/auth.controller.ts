import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { readString } from '../utils/request-body';

interface AuthBody {
  id?: unknown;
  password?: unknown;
}

interface RefreshBody {
  refreshToken?: unknown;
}

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async signup(req: Request<unknown, unknown, AuthBody>, res: Response): Promise<void> {
    const tokens = await this.authService.signup({
      id: readString(req.body?.id),
      password: readString(req.body?.password),
    });
    res.status(201).json(tokens);
  }

  async signin(req: Request<unknown, unknown, AuthBody>, res: Response): Promise<void> {
    const tokens = await this.authService.signin({
      id: readString(req.body?.id),
      password: readString(req.body?.password),
    });
    res.status(200).json(tokens);
  }

  async refreshToken(req: Request<unknown, unknown, RefreshBody>, res: Response): Promise<void> {
    const tokens = await this.authService.refreshTokens(req.body?.refreshToken);
    res.status(200).json(tokens);
  }

  info(req: Request, res: Response): void {
    const { userId } = (req as AuthenticatedRequest).auth;
    res.status(200).json({ id: userId });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { sessionId } = (req as AuthenticatedRequest).auth;
    await this.authService.logout(sessionId);
    res.status(200).json({ message: 'Logged out' });
  }
}
