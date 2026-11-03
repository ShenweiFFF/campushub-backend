import { Request, Response } from "express";
import {
  cancelReservation,
  confirmReservation,
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

function readPathId(value: string | string[] | undefined, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${fieldName} must be a non-empty string.`);
  }
  return value;
}

export async function postReservation(req: Request, res: Response): Promise<void> {
  const input: CreateReservationInput = parseCreateBody(req.body);
  const payload: Reservation = await createReservation(input);
  res.status(201).json(payload);
}

export async function getUserReservations(req: Request, res: Response): Promise<void> {
  const payload: Reservation[] = await listActiveReservationsByUser(
    readPathId(req.params.userId, "userId"),
  );
  res.status(200).json(payload);
}

export async function patchCancelReservation(req: Request, res: Response): Promise<void> {
  const payload: Reservation = await cancelReservation(readPathId(req.params.id, "id"));
  res.status(200).json(payload);
}

export async function patchConfirmReservation(req: Request, res: Response): Promise<void> {
  const payload: Reservation = await confirmReservation(readPathId(req.params.id, "id"));
  res.status(200).json(payload);
}
