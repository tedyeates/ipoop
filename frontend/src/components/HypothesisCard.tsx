import type { Hypothesis } from "../lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
}

const directionIcon: Record<Hypothesis["direction"], string> = {
  worsens: "↑",
  improves: "↓",
  unclear: "?",
};

const directionColor: Record<Hypothesis["direction"], string> = {
  worsens: "text-red-600",
  improves: "text-green-600",
  unclear: "text-gray-500",
};

export function HypothesisCard({ hypothesis }: HypothesisCardProps) {
  const {
    trigger_name,
    fodmap_category,
    confidence_score,
    confidence_label,
    direction,
    symptom_pattern,
    supporting_events,
    contradicting_events,
    notes,
  } = hypothesis;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{trigger_name}</h3>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            FODMAP: {fodmap_category || "—"}
          </span>
        </div>
        <span
          className={`text-lg font-bold ${directionColor[direction]}`}
          title={direction}
        >
          {directionIcon[direction]} {direction}
        </span>
      </div>

      {/* Confidence */}
      <ConfidenceBadge score={confidence_score} label={confidence_label} />

      {/* Symptom pattern */}
      <p className="text-sm text-gray-700">{symptom_pattern}</p>

      {/* Event counts */}
      <div className="flex gap-4 text-xs text-gray-600">
        <span className="text-green-700">
          ✓ {supporting_events} supporting
        </span>
        <span className="text-red-700">
          ✗ {contradicting_events} contradicting
        </span>
      </div>

      {/* Notes */}
      {notes && (
        <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
          {notes}
        </p>
      )}
    </div>
  );
}
