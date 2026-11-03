import { RESOURCE_TYPES, type ResourceType } from "./contracts";

export {
  RESERVATION_STATUSES,
  RESOURCE_TYPES,
  type CreateReservationDTO,
  type CreateReservationInput,
  type ErrorResponse,
  type Reservation,
  type ReservationStatus,
  type Resource,
  type ResourceType,
} from "./contracts";

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

export function isResourceType(value: string): value is ResourceType {
  return (RESOURCE_TYPES as readonly string[]).includes(value);
}
