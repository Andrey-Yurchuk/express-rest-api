import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { AuthService } from '../services/auth.service';
import { readString } from '../utils/request-body';

interface AuthBody {
  id?: unknown;
  password?: unknown;
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
}
