import {
  AppError,
  CreateReservationInput,
  isResourceType,
  Reservation,
  Resource,
  ResourceType,
} from "../types/reservation";

const ISO_8601_DATE_TIME: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const resources: Resource[] = [
  {
    id: "res-101",
    name: "Study Room 302",
    type: "STUDY_ROOM",
    location: "Library Floor 3",
    isAvailable: true,
  },
  {
    id: "res-102",
    name: "3D Printer A",
    type: "EQUIPMENT",
    location: "Maker Space",
    isAvailable: true,
  },
  {
    id: "res-103",
    name: "Chem Lab 1",
    type: "LAB",
    location: "Science Building",
    isAvailable: true,
  },
  {
    id: "res-104",
    name: "Lecture Room 201",
    type: "ROOM",
    location: "Main Hall",
    isAvailable: true,
  },
];

const reservations: Reservation[] = [];

let reservationCounter: number = 1;

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
  if (!ISO_8601_DATE_TIME.test(value)) {
    return false;
  }
  const parsed: number = Date.parse(value);
  return !Number.isNaN(parsed);
}

function intervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return Date.parse(startA) < Date.parse(endB) && Date.parse(startB) < Date.parse(endA);
}

export function listResources(typeFilter?: string): Resource[] {
  if (typeFilter === undefined) {
    return [...resources];
  }

  const normalized: string = assertNonEmptyString(typeFilter, "type");
  if (!isResourceType(normalized)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "type must be a non-empty string when provided.",
    );
  }

  const resourceType: ResourceType = normalized;
  return resources.filter((resource: Resource) => resource.type === resourceType);
}

export function createReservation(input: CreateReservationInput): Reservation {
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

  if (Date.parse(endTime) <= Date.parse(startTime)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "endTime must be later than startTime.",
    );
  }

  const resource: Resource | undefined = resources.find(
    (item: Resource) => item.id === resourceId,
  );
  if (resource === undefined) {
    throw new AppError(400, "VALIDATION_ERROR", "resourceId does not match a known resource.");
  }

  const hasConflict: boolean = reservations.some((existing: Reservation) => {
    if (existing.resourceId !== resourceId) {
      return false;
    }
    if (existing.status === "CANCELLED") {
      return false;
    }
    return intervalsOverlap(existing.startTime, existing.endTime, startTime, endTime);
  });

  if (hasConflict) {
    throw new AppError(
      409,
      "DOUBLE_BOOKING",
      "Resource is already reserved for this time slot.",
    );
  }

  const created: Reservation = {
    id: `rsv-${String(reservationCounter)}`,
    resourceId,
    userId,
    startTime,
    endTime,
    status: "PENDING",
  };
  reservationCounter += 1;
  reservations.push(created);
  return created;
}

export function listActiveReservationsByUser(userId: string): Reservation[] {
  const normalizedUserId: string = assertNonEmptyString(userId, "userId");
  return reservations.filter(
    (reservation: Reservation) =>
      reservation.userId === normalizedUserId && reservation.status !== "CANCELLED",
  );
}
