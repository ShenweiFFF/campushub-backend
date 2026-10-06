import { NextFunction, Request, Response } from "express";
import { listResources } from "../services/resource.service";
import { AppError, Resource } from "../types/reservation";

function readQueryString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "type must be a non-empty string when provided.",
    );
  }
  return value;
}

export async function getResources(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const typeFilter: string | undefined = readQueryString(req.query.type);
    const payload: Resource[] = await listResources(typeFilter);
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}
