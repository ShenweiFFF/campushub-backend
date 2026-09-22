import { NextFunction, Request, Response } from "express";
import { getHealthStatus, HealthStatus } from "../services/health.service";

export async function healthCheck(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload: HealthStatus = getHealthStatus();
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}
