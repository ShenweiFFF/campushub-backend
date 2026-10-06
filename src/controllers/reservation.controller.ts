import { NextFunction, Request, Response } from "express";
import {
  createReservation,
  listActiveReservationsByUser,
} from "../services/reservation.service";
import { AppError, CreateReservationInput, Reservation } from "../types/reservation";

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

export async function postReservation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input: CreateReservationInput = parseCreateBody(req.body);
    const payload: Reservation = await createReservation(input);
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
    const payload: Reservation[] = await listActiveReservationsByUser(rawUserId);
    res.status(200).json(payload);
  } catch (err: unknown) {
    next(err);
  }
}
