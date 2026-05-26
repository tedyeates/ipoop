import { useState, useEffect } from "react";
import type { Hypothesis } from "../lib/types";
import {
  getMeals,
  getStools,
  getSymptoms,
  getHypotheses,
} from "../mocks/api";

export interface DashboardSummary {
  todayLogCount: number;
  recentSymptomScore: number | null;
  recentBristolType: number | null;
  topHypothesis: Hypothesis | null;
}

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [meals, stools, symptoms, review] = await Promise.all([
          getMeals(),
          getStools(),
          getSymptoms(),
          getHypotheses(),
        ]);

        if (cancelled) return;

        // Count today's logs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayISO = todayStart.toISOString();

        const todayLogCount =
          meals.filter((m) => m.logged_at >= todayISO).length +
          stools.filter((s) => s.logged_at >= todayISO).length +
          symptoms.filter((s) => s.logged_at >= todayISO).length;

        // Most recent symptom overall score
        const recentSymptomScore =
          symptoms.length > 0 ? symptoms[0].overall : null;

        // Most recent Bristol type
        const recentBristolType =
          stools.length > 0 ? stools[0].bristol_type : null;

        // Highest confidence hypothesis
        let topHypothesis: Hypothesis | null = null;
        if (review && review.hypotheses.length > 0) {
          topHypothesis = review.hypotheses.reduce((best, h) =>
            h.confidence_score > best.confidence_score ? h : best,
          );
        }

        setData({
          todayLogCount,
          recentSymptomScore,
          recentBristolType,
          topHypothesis,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          const message =
            e && typeof e === "object" && "message" in e
              ? String((e as { message: string }).message)
              : "Failed to load dashboard data";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
