import { isValidObjectId } from "mongoose";
import {
  ReservationDocument,
  ReservationModel,
} from "../models/Reservation.model";
import { ResourceModel } from "../models/Resource.model";
import { AppError, CreateReservationInput, Reservation } from "../types/reservation";

const ISO_8601_DATE_TIME: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `${fieldName} must be a non-empty string when provided.`,
    );
  }
  return value;
}

function isIso8601DateTime(value: string): boolean {
  return ISO_8601_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value));
}

function toReservationDto(doc: ReservationDocument): Reservation {
  return {
    id: doc._id.toString(),
    resourceId: doc.resourceId.toString(),
    userId: doc.userId,
    startTime: doc.startTime.toISOString(),
    endTime: doc.endTime.toISOString(),
    status: doc.status,
  };
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  const resourceId: string = assertNonEmptyString(input.resourceId, "resourceId");
  const userId: string = assertNonEmptyString(input.userId, "userId");
  const startTime: string = assertNonEmptyString(input.startTime, "startTime");
  const endTime: string = assertNonEmptyString(input.endTime, "endTime");

  if (!isIso8601DateTime(startTime) || !isIso8601DateTime(endTime)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "startTime and endTime must be ISO 8601 date-time strings.",
    );
  }

  const start: Date = new Date(startTime);
  const end: Date = new Date(endTime);
  if (end.getTime() <= start.getTime()) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "endTime must be later than startTime.",
    );
  }

  const resourceExists: boolean =
    isValidObjectId(resourceId) &&
    (await ResourceModel.exists({ _id: resourceId })) !== null;
  if (!resourceExists) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "resourceId does not match a known resource.",
    );
  }

  const conflict: boolean =
    (await ReservationModel.exists({
      resourceId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: end },
      endTime: { $gt: start },
    })) !== null;
  if (conflict) {
    throw new AppError(
      409,
      "DOUBLE_BOOKING",
      "Resource is already reserved for this time slot.",
    );
  }

  const created: ReservationDocument = await ReservationModel.create({
    resourceId,
    userId,
    startTime: start,
    endTime: end,
    status: "PENDING",
  });
  return toReservationDto(created);
}

export async function listActiveReservationsByUser(
  userId: string,
): Promise<Reservation[]> {
  const normalizedUserId: string = assertNonEmptyString(userId, "userId");
  const docs: ReservationDocument[] = await ReservationModel.find({
    userId: normalizedUserId,
    status: { $ne: "CANCELLED" },
  }).sort({ _id: 1 });
  return docs.map(toReservationDto);
}
