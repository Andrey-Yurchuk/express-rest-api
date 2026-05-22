import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class HealthController {
  getHealth(_req: Request, res: Response): void {
    res.status(200).json({ status: 'ok' });
  }
}
