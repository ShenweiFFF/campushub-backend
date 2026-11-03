import { useState } from "react";
import type { FormEvent, JSX } from "react";
import { useCreateReservation, useResourceOptions } from "../hooks/useReservations";
import type { Resource } from "../api/campushubApi";
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
  const options = useResourceOptions();
  const booking = useCreateReservation(onBooked);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const alertMessage: string | null = booking.error ?? options.error;
  const missingSelected: boolean =
    resourceId !== "" &&
    !options.resources.some((resource: Resource) => resource.id === resourceId);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void booking.submit({ userId, resourceId, startTime, endTime });
  }

  return (
    <section className={styles.panel} aria-labelledby="booking-heading">
      <h2 id="booking-heading">Book a time</h2>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          Resource
          <select
            value={resourceId}
            onChange={(event): void => onResourceIdChange(event.target.value)}
            disabled={booking.isSubmitting}
          >
            <option value="">Select a resource</option>
            {missingSelected ? <option value={resourceId}>{resourceId}</option> : null}
            {options.resources.map((resource: Resource) => (
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
            disabled={booking.isSubmitting}
            required
          />
        </label>
        <label className={styles.field}>
          End
          <input
            type="datetime-local"
            value={endTime}
            onChange={(event): void => setEndTime(event.target.value)}
            disabled={booking.isSubmitting}
            required
          />
        </label>
        {alertMessage !== null ? (
          <p className={styles.error} role="alert">
            {alertMessage}
          </p>
        ) : null}
        {booking.success !== null ? (
          <p className={styles.success} role="status">
            {booking.success}
          </p>
        ) : null}
        <button
          className={styles.submit}
          type="submit"
          disabled={booking.isSubmitting || options.isLoading}
        >
          {booking.isSubmitting ? "Booking…" : "Request reservation"}
        </button>
      </form>
      {options.isLoading ? <p className={styles.status}>Loading resources…</p> : null}
    </section>
  );
}
