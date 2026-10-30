import { useState } from "react";
import type { JSX } from "react";
import BookingForm from "./components/BookingForm";
import ResourceList from "./components/ResourceList";
import UserReservations from "./components/UserReservations";
import styles from "./App.module.css";

export default function App(): JSX.Element {
  const [userId, setUserId] = useState<string>("student-1");
  const [resourceId, setResourceId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>CampusHub</p>
          <h1>Reserve a campus resource</h1>
        </div>
        <label className={styles.studentField}>
          Student id
          <input
            value={userId}
            onChange={(event): void => setUserId(event.target.value)}
            autoComplete="off"
          />
        </label>
      </header>
      <main className={styles.layout}>
        <ResourceList selectedResourceId={resourceId} onSelectResource={setResourceId} />
        <div className={styles.side}>
          <BookingForm
            userId={userId}
            resourceId={resourceId}
            onResourceIdChange={setResourceId}
            onBooked={(): void => setRefreshKey((current: number): number => current + 1)}
          />
          <UserReservations userId={userId} refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
