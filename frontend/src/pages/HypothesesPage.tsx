import { useState, useEffect, useCallback } from "react";
import type { ReviewResponse } from "../lib/types";
import { getHypotheses, runReview } from "../lib/api";
import { HypothesisCard } from "../components/HypothesisCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Disclaimer from "../components/Disclaimer";

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HypothesesPage() {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHypotheses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHypotheses();
      setReview(data);
    } catch {
      setError("Failed to load hypotheses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHypotheses();
  }, [fetchHypotheses]);

  const handleRunReview = async () => {
    setReviewing(true);
    setError(null);
    try {
      const data = await runReview();
      setReview(data);
    } catch {
      setError("AI review failed. Please try again.");
    } finally {
      setReviewing(false);
    }
  };

  // Initial loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty state — no hypotheses yet
  if (!review && !error) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">AI Hypotheses</h1>
        <div className="text-center py-12 space-y-4">
          <div className="text-4xl">🔬</div>
          <h2 className="text-lg font-semibold text-gray-700">
            No hypotheses yet
          </h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Run your first AI review to analyse your logged data and identify
            potential triggers.
          </p>
          <button
            onClick={handleRunReview}
            disabled={reviewing}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {reviewing && <LoadingSpinner size="sm" />}
            {reviewing ? "Analysing…" : "Run AI Review"}
          </button>
          <Disclaimer variant="contextual" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-xl font-bold text-gray-900">AI Hypotheses</h1>

      {/* Run Review button + metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={handleRunReview}
          disabled={reviewing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {reviewing && <LoadingSpinner size="sm" />}
          {reviewing ? "Analysing…" : "Run AI Review"}
        </button>

        {review && (
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>Last review: {formatReviewDate(review.reviewed_at)}</p>
            <p>{review.entries_analysed} entries analysed</p>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* AI Summary */}
      {review && (
        <>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
            <p className="text-sm text-gray-800 leading-relaxed">
              {review.summary}
            </p>
            <Disclaimer variant="contextual" />
          </div>

          {/* Hypothesis cards */}
          <div className="space-y-3">
            {review.hypotheses.map((h) => (
              <HypothesisCard key={h.trigger_name} hypothesis={h} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
