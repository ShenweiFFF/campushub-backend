export type ResourceType = "ROOM" | "EQUIPMENT" | "LAB" | "STUDY_ROOM";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
];

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export interface CreateReservationInput {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const RESOURCE_TYPES: readonly ResourceType[] = [
  "ROOM",
  "EQUIPMENT",
  "LAB",
  "STUDY_ROOM",
];

export function isResourceType(value: string): value is ResourceType {
  return (RESOURCE_TYPES as readonly string[]).includes(value);
}
