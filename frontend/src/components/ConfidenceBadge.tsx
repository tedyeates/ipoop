import type { ConfidenceLabel } from "../lib/types";

interface ConfidenceBadgeProps {
  score: number;
  label: ConfidenceLabel;
}

const badgeStyles: Record<ConfidenceLabel, string> = {
  Low: "bg-gray-100 text-gray-700 border-gray-300",
  Moderate: "bg-amber-50 text-amber-700 border-amber-300",
  High: "bg-blue-50 text-blue-700 border-blue-300",
  "Very High": "bg-emerald-50 text-emerald-700 border-emerald-300",
};

const barStyles: Record<ConfidenceLabel, string> = {
  Low: "bg-gray-400",
  Moderate: "bg-amber-400",
  High: "bg-blue-500",
  "Very High": "bg-emerald-500",
};

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  const pct = Math.round((score / 0.95) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${barStyles[label]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeStyles[label]}`}
      >
        {label} ({score.toFixed(2)})
      </span>
    </div>
  );
}
