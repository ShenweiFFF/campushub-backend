import { NextFunction, Request, Response } from 'express';
import { getHealthStatus } from '../services/healthService';

export async function getHealth(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = getHealthStatus();
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}
