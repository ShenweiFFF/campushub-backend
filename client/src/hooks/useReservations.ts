import { useEffect, useState } from "react";
import {
  cancelReservation,
  createReservation,
  errorMessage,
  fetchResources,
  fetchUserReservations,
  type Reservation,
  type Resource,
} from "../api/campushubApi";

export interface BookingDraft {
  userId: string;
  resourceId: string;
  startTime: string;
  endTime: string;
}

export interface CreateReservationState {
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
  submit: (draft: BookingDraft) => Promise<void>;
}

export interface ReservationListState {
  reservations: Reservation[];
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  cancellingId: string | null;
  cancel: (reservationId: string) => Promise<void>;
}

export interface ResourceOptionsState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
}

export function useCreateReservation(onBooked: () => void): CreateReservationState {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(draft: BookingDraft): Promise<void> {
    setSuccess(null);
    const validationError: string | null = validateBooking(draft);
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    const startIso: string | null = toIsoDateTime(draft.startTime);
    const endIso: string | null = toIsoDateTime(draft.endTime);
    if (startIso === null || endIso === null) {
      setError("Enter a valid start and end time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createReservation({
        resourceId: draft.resourceId,
        userId: draft.userId.trim(),
        startTime: startIso,
        endTime: endIso,
      });
      setSuccess("Reservation created.");
      onBooked();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, success, submit };
}

export function useResourceOptions(): ResourceOptionsState {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active: boolean = true;
    fetchResources()
      .then((items: Resource[]): void => {
        if (!active) {
          return;
        }
        setResources(items);
        setError(null);
      })
      .catch((err: unknown): void => {
        if (!active) {
          return;
        }
        setResources([]);
        setError(errorMessage(err));
      })
      .finally((): void => {
        if (active) {
          setIsLoading(false);
        }
      });

    return (): void => {
      active = false;
    };
  }, []);

  return { resources, isLoading, error };
}

export function useReservations(userId: string, refreshKey: number): ReservationListState {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const trimmedUserId: string = userId.trim();
  const loadKey: string = `${trimmedUserId}|${refreshKey}|${reloadKey}`;
  const isLoading: boolean = trimmedUserId.length > 0 && loadedKey !== loadKey;
  const visibleError: string | null = isLoading ? null : error;
  const visibleReservations: Reservation[] =
    trimmedUserId.length > 0 && loadedKey === loadKey ? reservations : [];

  useEffect(() => {
    if (trimmedUserId.length === 0) {
      return;
    }

    let active: boolean = true;
    const requestedKey: string = loadKey;

    Promise.all([fetchUserReservations(trimmedUserId), fetchResources()])
      .then(([nextReservations, nextResources]: [Reservation[], Resource[]]): void => {
        if (!active) {
          return;
        }
        setReservations(nextReservations);
        setResources(nextResources);
        setError(null);
        setLoadedKey(requestedKey);
      })
      .catch((err: unknown): void => {
        if (!active) {
          return;
        }
        setReservations([]);
        setError(errorMessage(err));
        setLoadedKey(requestedKey);
      });

    return (): void => {
      active = false;
    };
  }, [trimmedUserId, loadKey]);

  async function cancel(reservationId: string): Promise<void> {
    setCancellingId(reservationId);
    setError(null);
    try {
      await cancelReservation(reservationId);
      setReloadKey((current: number): number => current + 1);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return {
    reservations: visibleReservations,
    resources,
    isLoading,
    error: visibleError,
    cancellingId,
    cancel,
  };
}

function validateBooking(draft: BookingDraft): string | null {
  if (draft.userId.trim().length === 0) {
    return "Enter a student id.";
  }
  if (draft.resourceId.trim().length === 0) {
    return "Choose a resource.";
  }
  if (draft.startTime.trim().length === 0 || draft.endTime.trim().length === 0) {
    return "Choose a start and end time.";
  }
  const start: Date = new Date(draft.startTime);
  const end: Date = new Date(draft.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Enter a valid start and end time.";
  }
  if (end.getTime() <= start.getTime()) {
    return "End time must be later than start time.";
  }
  return null;
}

function toIsoDateTime(value: string): string | null {
  const date: Date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}
