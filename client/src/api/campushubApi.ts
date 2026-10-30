const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

const RESOURCE_TYPES: readonly ResourceType[] = [
  "ROOM",
  "EQUIPMENT",
  "LAB",
  "STUDY_ROOM",
];

const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
];

export type ResourceType = "ROOM" | "EQUIPMENT" | "LAB" | "STUDY_ROOM";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

export interface CreateReservationDTO {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
}

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export async function fetchResources(type?: string): Promise<Resource[]> {
  const params = new URLSearchParams();
  if (type !== undefined && type.trim().length > 0) {
    params.set("type", type.trim());
  }
  const query: string = params.toString();
  const path: string = query.length > 0 ? `/resources?${query}` : "/resources";
  const payload: unknown = await request(path);
  if (!isResourceList(payload)) {
    throw new ApiError(
      500,
      "INVALID_RESPONSE",
      "Resource list response did not match the API contract.",
    );
  }
  return payload;
}

export async function createReservation(
  payload: CreateReservationDTO,
): Promise<Reservation> {
  const body: unknown = await request("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!isReservation(body)) {
    throw new ApiError(
      500,
      "INVALID_RESPONSE",
      "Reservation response did not match the API contract.",
    );
  }
  return body;
}

export async function fetchUserReservations(userId: string): Promise<Reservation[]> {
  const payload: unknown = await request(
    `/reservations/user/${encodeURIComponent(userId)}`,
  );
  if (!isReservationList(payload)) {
    throw new ApiError(
      500,
      "INVALID_RESPONSE",
      "User reservation response did not match the API contract.",
    );
  }
  return payload;
}

export async function cancelReservation(reservationId: string): Promise<Reservation> {
  const payload: unknown = await request(
    `/reservations/${encodeURIComponent(reservationId)}/cancel`,
    { method: "PATCH" },
  );
  if (!isReservation(payload)) {
    throw new ApiError(
      500,
      "INVALID_RESPONSE",
      "Cancel response did not match the API contract.",
    );
  }
  return payload;
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the CampusHub API.");
  }

  const payload: unknown = await readJson(response);
  if (!response.ok) {
    throw toApiError(response.status, payload);
  }
  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  const text: string = await response.text();
  if (text.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const code: string = readStringField(payload, "code") ?? "REQUEST_FAILED";
  if (status === 409) {
    return new ApiError(
      status,
      code,
      "This resource is already reserved for the selected time window",
    );
  }
  const message: string =
    readStringField(payload, "message") ?? "The request could not be completed.";
  return new ApiError(status, code, message);
}

function readStringField(payload: unknown, field: string): string | null {
  if (payload === null || typeof payload !== "object") {
    return null;
  }
  const record: Record<string, unknown> = payload as Record<string, unknown>;
  const value: unknown = record[field];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isResourceType(value: unknown): value is ResourceType {
  return typeof value === "string" && RESOURCE_TYPES.includes(value as ResourceType);
}

function isReservationStatus(value: unknown): value is ReservationStatus {
  return (
    typeof value === "string" && RESERVATION_STATUSES.includes(value as ReservationStatus)
  );
}

function isResource(value: unknown): value is Resource {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    isResourceType(record.type) &&
    typeof record.location === "string" &&
    typeof record.isAvailable === "boolean"
  );
}

function isResourceList(value: unknown): value is Resource[] {
  return Array.isArray(value) && value.every(isResource);
}

function isReservation(value: unknown): value is Reservation {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.resourceId === "string" &&
    typeof record.userId === "string" &&
    typeof record.startTime === "string" &&
    typeof record.endTime === "string" &&
    isReservationStatus(record.status)
  );
}

function isReservationList(value: unknown): value is Reservation[] {
  return Array.isArray(value) && value.every(isReservation);
}
