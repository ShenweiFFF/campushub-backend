import { useEffect, useState } from "react";
import type { FormEvent, JSX } from "react";
import {
  createReservation,
  errorMessage,
  fetchResources,
  type Resource,
} from "../api/campushubApi";
import styles from "./BookingForm.module.css";

interface BookingFormProps {
  userId: string;
  resourceId: string;
  onResourceIdChange: (resourceId: string) => void;
  onBooked: () => void;
}

export default function BookingForm({
  userId,
  resourceId,
  onResourceIdChange,
  onBooked,
}: BookingFormProps): JSX.Element {
  const [resources, setResources] = useState<Resource[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active: boolean = true;
    fetchResources()
      .then((items: Resource[]): void => {
        if (active) {
          setResources(items);
          setError(null);
        }
      })
      .catch((err: unknown): void => {
        if (active) {
          setResources([]);
          setError(errorMessage(err));
        }
      })
      .finally((): void => {
        if (active) {
          setIsLoadingOptions(false);
        }
      });

    return (): void => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSuccess(null);

    const validationError: string | null = validateBooking(
      userId,
      resourceId,
      startTime,
      endTime,
    );
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    const startIso: string | null = toIsoDateTime(startTime);
    const endIso: string | null = toIsoDateTime(endTime);
    if (startIso === null || endIso === null) {
      setError("Enter a valid start and end time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createReservation({
        resourceId,
        userId: userId.trim(),
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

  const missingSelected: boolean =
    resourceId !== "" && !resources.some((resource: Resource) => resource.id === resourceId);

  return (
    <section className={styles.panel} aria-labelledby="booking-heading">
      <h2 id="booking-heading">Book a time</h2>
      <form
        className={styles.form}
        onSubmit={(event: FormEvent<HTMLFormElement>): void => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <label className={styles.field}>
          Resource
          <select
            value={resourceId}
            onChange={(event): void => onResourceIdChange(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a resource</option>
            {missingSelected ? <option value={resourceId}>{resourceId}</option> : null}
            {resources.map((resource: Resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Start
          <input
            type="datetime-local"
            value={startTime}
            onChange={(event): void => setStartTime(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>
        <label className={styles.field}>
          End
          <input
            type="datetime-local"
            value={endTime}
            onChange={(event): void => setEndTime(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>
        {error !== null ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {success !== null ? (
          <p className={styles.success} role="status">
            {success}
          </p>
        ) : null}
        <button className={styles.submit} type="submit" disabled={isSubmitting || isLoadingOptions}>
          {isSubmitting ? "Booking…" : "Request reservation"}
        </button>
      </form>
      {isLoadingOptions ? <p className={styles.status}>Loading resources…</p> : null}
    </section>
  );
}

function validateBooking(
  userId: string,
  resourceId: string,
  startTime: string,
  endTime: string,
): string | null {
  if (userId.trim().length === 0) {
    return "Enter a student id.";
  }
  if (resourceId.trim().length === 0) {
    return "Choose a resource.";
  }
  if (startTime.trim().length === 0 || endTime.trim().length === 0) {
    return "Choose a start and end time.";
  }
  const start: Date = new Date(startTime);
  const end: Date = new Date(endTime);
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
