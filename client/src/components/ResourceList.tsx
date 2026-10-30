import { useEffect, useState } from "react";
import type { JSX } from "react";
import {
  errorMessage,
  fetchResources,
  type Resource,
  type ResourceType,
} from "../api/campushubApi";
import styles from "./ResourceList.module.css";

interface ResourceListProps {
  selectedResourceId: string;
  onSelectResource: (resourceId: string) => void;
}

type TypeFilter = "ALL" | ResourceType;

const FILTERS: readonly TypeFilter[] = [
  "ALL",
  "ROOM",
  "EQUIPMENT",
  "LAB",
  "STUDY_ROOM",
];

const FILTER_LABELS: Record<TypeFilter, string> = {
  ALL: "All",
  ROOM: "Rooms",
  EQUIPMENT: "Equipment",
  LAB: "Labs",
  STUDY_ROOM: "Study rooms",
};

export default function ResourceList({
  selectedResourceId,
  onSelectResource,
}: ResourceListProps): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedFilter, setLoadedFilter] = useState<TypeFilter | null>(null);
  const isLoading: boolean = loadedFilter !== typeFilter;
  const visibleError: string | null = isLoading ? null : error;

  useEffect(() => {
    let active: boolean = true;
    const requestedFilter: TypeFilter = typeFilter;
    const type: ResourceType | undefined =
      requestedFilter === "ALL" ? undefined : requestedFilter;

    fetchResources(type)
      .then((items: Resource[]): void => {
        if (!active) {
          return;
        }
        setResources(items);
        setError(null);
        setLoadedFilter(requestedFilter);
      })
      .catch((err: unknown): void => {
        if (!active) {
          return;
        }
        setResources([]);
        setError(errorMessage(err));
        setLoadedFilter(requestedFilter);
      });

    return (): void => {
      active = false;
    };
  }, [typeFilter]);

  return (
    <section className={styles.panel} aria-labelledby="resource-heading">
      <div className={styles.headingRow}>
        <h2 id="resource-heading">Resource directory</h2>
        <p>Choose a room, lab, or piece of equipment.</p>
      </div>
      <div className={styles.filters} role="group" aria-label="Filter by resource type">
        {FILTERS.map((filter: TypeFilter) => (
          <button
            key={filter}
            type="button"
            className={filter === typeFilter ? styles.filterActive : styles.filter}
            aria-pressed={filter === typeFilter}
            onClick={(): void => setTypeFilter(filter)}
          >
            {FILTER_LABELS[filter]}
          </button>
        ))}
      </div>
      {visibleError !== null ? (
        <p className={styles.error} role="alert">
          {visibleError}
        </p>
      ) : null}
      {isLoading ? <p className={styles.status}>Loading resources…</p> : null}
      {!isLoading && visibleError === null && resources.length === 0 ? (
        <p className={styles.status}>No resources match this filter.</p>
      ) : null}
      {!isLoading ? (
        <ul className={styles.grid}>
          {resources.map((resource: Resource) => {
            const selected: boolean = resource.id === selectedResourceId;
            return (
              <li key={resource.id}>
                <button
                  type="button"
                  className={selected ? styles.cardSelected : styles.card}
                  aria-pressed={selected}
                  onClick={(): void => onSelectResource(resource.id)}
                >
                  <span className={styles.type}>{resource.type}</span>
                  <span className={styles.name}>{resource.name}</span>
                  <span className={styles.location}>{resource.location}</span>
                  <span className={resource.isAvailable ? styles.available : styles.unavailable}>
                    {resource.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
