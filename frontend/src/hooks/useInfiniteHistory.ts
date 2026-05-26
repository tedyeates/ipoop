import { useState, useEffect, useCallback, useRef } from "react";
import type { MealLog, StoolLog, ContextLog, SymptomLog } from "../lib/types";
import * as api from "../lib/api";

export type HistoryEntry =
  | { type: "meal"; data: MealLog }
  | { type: "stool"; data: StoolLog }
  | { type: "context"; data: ContextLog }
  | { type: "symptom"; data: SymptomLog };

export interface DayGroup {
  date: string; // YYYY-MM-DD
  entries: HistoryEntry[];
}

const INITIAL_DAYS = 14;
const BATCH_DAYS = 7;

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function groupByDay(entries: HistoryEntry[]): DayGroup[] {
  const map = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const key = toDateKey(entry.data.logged_at);
    const group = map.get(key);
    if (group) {
      group.push(entry);
    } else {
      map.set(key, [entry]);
    }
  }

  // Sort days reverse chronological
  const days = Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayEntries]) => ({
      date,
      // Sort entries within day by logged_at descending
      entries: dayEntries.sort(
        (a, b) => b.data.logged_at.localeCompare(a.data.logged_at),
      ),
    }));

  return days;
}

export function useInfiniteHistory() {
  const [allGroups, setAllGroups] = useState<DayGroup[]>([]);
  const [visibleGroups, setVisibleGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const visibleDaysCount = useRef(INITIAL_DAYS);

  // Fetch all data once, group by day
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [meals, stools, contexts, symptoms] = await Promise.all([
          api.getMeals(),
          api.getStools(),
          api.getContext(),
          api.getSymptoms(),
        ]);

        if (cancelled) return;

        const entries: HistoryEntry[] = [
          ...meals.map((data) => ({ type: "meal" as const, data })),
          ...stools.map((data) => ({ type: "stool" as const, data })),
          ...contexts.map((data) => ({ type: "context" as const, data })),
          ...symptoms.map((data) => ({ type: "symptom" as const, data })),
        ];

        const groups = groupByDay(entries);
        setAllGroups(groups);

        // Show initial batch
        const initial = groups.slice(0, INITIAL_DAYS);
        setVisibleGroups(initial);
        setHasMore(groups.length > INITIAL_DAYS);
        visibleDaysCount.current = INITIAL_DAYS;
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Failed to load history";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    const nextCount = visibleDaysCount.current + BATCH_DAYS;
    const next = allGroups.slice(0, nextCount);
    setVisibleGroups(next);
    setHasMore(allGroups.length > nextCount);
    visibleDaysCount.current = nextCount;
  }, [allGroups]);

  return {
    groups: visibleGroups,
    loading,
    error,
    hasMore,
    loadMore,
    isEmpty: !loading && allGroups.length === 0,
  };
}
