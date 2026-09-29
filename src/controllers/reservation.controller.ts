import { NextFunction, Request, Response } from "express";
import {
  createReservation,
  listActiveReservationsByUser,
  listResources,
} from "../services/reservation.service";
import {
  AppError,
  CreateReservationInput,
  Reservation,
  Resource,
} from "../types/reservation";

function readQueryString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "type must be a non-empty string when provided.",
    );
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

function parseCreateBody(body: unknown): CreateReservationInput {
  if (body === null || typeof body !== "object") {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be a JSON object.");
  }

  const record: Record<string, unknown> = body as Record<string, unknown>;
  const resourceId: unknown = record.resourceId;
  const userId: unknown = record.userId;
  const startTime: unknown = record.startTime;
  const endTime: unknown = record.endTime;

  if (
    typeof resourceId !== "string" ||
    typeof userId !== "string" ||
    typeof startTime !== "string" ||
    typeof endTime !== "string"
  ) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "resourceId, userId, startTime, and endTime are required strings.",
    );
  }

  return { resourceId, userId, startTime, endTime };
}

export async function getResources(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const typeFilter: string | undefined = readQueryString(req.query.type);
    const payload: Resource[] = listResources(typeFilter);
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}

export async function postReservation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input: CreateReservationInput = parseCreateBody(req.body);
    const payload: Reservation = createReservation(input);
    res.status(201).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}

export async function getUserReservations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawUserId: string | string[] | undefined = req.params.userId;
    if (typeof rawUserId !== "string" || rawUserId.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "userId must be a non-empty string.");
    }
    const userId: string = rawUserId;
    const payload: Reservation[] = listActiveReservationsByUser(userId);
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}
