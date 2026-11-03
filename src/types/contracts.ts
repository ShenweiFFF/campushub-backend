export const RESOURCE_TYPES = ["ROOM", "EQUIPMENT", "LAB", "STUDY_ROOM"] as const;

export const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

export interface CreateReservationInput {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
}

export type CreateReservationDTO = CreateReservationInput;

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export interface ErrorResponse {
  code: string;
  message: string;
}
