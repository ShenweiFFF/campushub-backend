import { Request, Response } from "express";
import { getHealthStatus, HealthStatus } from "../services/health.service";

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const payload: HealthStatus = getHealthStatus();
  res.status(200).json(payload);
}
