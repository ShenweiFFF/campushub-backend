import type { JSX } from "react";
import { useReservations } from "../hooks/useReservations";
import type { Reservation, Resource } from "../api/campushubApi";
import styles from "./UserReservations.module.css";

interface UserReservationsProps {
  userId: string;
  refreshKey: number;
}

export default function UserReservations({
  userId,
  refreshKey,
}: UserReservationsProps): JSX.Element {
  const list = useReservations(userId, refreshKey);
  const trimmedUserId: string = userId.trim();

  return (
    <section className={styles.panel} aria-labelledby="reservations-heading">
      <h2 id="reservations-heading">My bookings</h2>
      {trimmedUserId.length === 0 ? (
        <p className={styles.status}>Enter a student id to see bookings.</p>
      ) : null}
      {list.error !== null ? (
        <p className={styles.error} role="alert">
          {list.error}
        </p>
      ) : null}
      {list.isLoading ? <p className={styles.status}>Loading bookings…</p> : null}
      {!list.isLoading && trimmedUserId.length > 0 && list.error === null && list.reservations.length === 0 ? (
        <p className={styles.status}>No active reservations.</p>
      ) : null}
      <ul className={styles.list}>
        {list.reservations.map((reservation: Reservation) => {
          const isCancelling: boolean = list.cancellingId === reservation.id;
          return (
            <li key={reservation.id} className={styles.item}>
              <div>
                <p className={styles.name}>{resourceName(list.resources, reservation.resourceId)}</p>
                <p className={styles.when}>
                  {formatWhen(reservation.startTime)} – {formatWhen(reservation.endTime)}
                </p>
                <p className={styles.meta}>{reservation.status}</p>
              </div>
              <button
                type="button"
                className={styles.cancel}
                disabled={list.cancellingId !== null}
                onClick={(): void => {
                  void list.cancel(reservation.id);
                }}
              >
                {isCancelling ? "Cancelling…" : "Cancel reservation"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function resourceName(resources: Resource[], resourceId: string): string {
  const match: Resource | undefined = resources.find(
    (resource: Resource): boolean => resource.id === resourceId,
  );
  return match === undefined ? resourceId : match.name;
}

function formatWhen(iso: string): string {
  const date: Date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}
