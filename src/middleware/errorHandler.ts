import { NextFunction, Request, Response } from "express";
import { AppError, ErrorResponse } from "../types/reservation";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const payload: ErrorResponse = { code: err.code, message: err.message };
    res.status(err.statusCode).json(payload);
    return;
  }

  const message: string =
    err instanceof Error ? err.message : "Internal Server Error";
  const payload: ErrorResponse = { code: "INTERNAL_ERROR", message };
  res.status(500).json(payload);
}
