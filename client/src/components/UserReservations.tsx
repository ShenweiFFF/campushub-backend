import { useEffect, useState } from "react";
import type { JSX } from "react";
import {
  cancelReservation,
  errorMessage,
  fetchResources,
  fetchUserReservations,
  type Reservation,
  type Resource,
} from "../api/campushubApi";
import styles from "./UserReservations.module.css";

interface UserReservationsProps {
  userId: string;
  refreshKey: number;
}

export default function UserReservations({
  userId,
  refreshKey,
}: UserReservationsProps): JSX.Element {
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

  async function handleCancel(reservationId: string): Promise<void> {
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

  return (
    <section className={styles.panel} aria-labelledby="reservations-heading">
      <h2 id="reservations-heading">My bookings</h2>
      {trimmedUserId.length === 0 ? (
        <p className={styles.status}>Enter a student id to see bookings.</p>
      ) : null}
      {visibleError !== null ? (
        <p className={styles.error} role="alert">
          {visibleError}
        </p>
      ) : null}
      {isLoading ? <p className={styles.status}>Loading bookings…</p> : null}
      {!isLoading && trimmedUserId.length > 0 && visibleError === null && visibleReservations.length === 0 ? (
        <p className={styles.status}>No active reservations.</p>
      ) : null}
      <ul className={styles.list}>
        {visibleReservations.map((reservation: Reservation) => {
          const isCancelling: boolean = cancellingId === reservation.id;
          return (
            <li key={reservation.id} className={styles.item}>
              <div>
                <p className={styles.name}>{resourceName(resources, reservation.resourceId)}</p>
                <p className={styles.when}>
                  {formatWhen(reservation.startTime)} – {formatWhen(reservation.endTime)}
                </p>
                <p className={styles.meta}>{reservation.status}</p>
              </div>
              <button
                type="button"
                className={styles.cancel}
                disabled={cancellingId !== null}
                onClick={(): void => {
                  void handleCancel(reservation.id);
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
