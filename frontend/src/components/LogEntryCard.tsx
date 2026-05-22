import type { MealLog, StoolLog, ContextLog, SymptomLog } from "../lib/types";

type LogEntry =
  | { type: "meal"; data: MealLog }
  | { type: "stool"; data: StoolLog }
  | { type: "context"; data: ContextLog }
  | { type: "symptom"; data: SymptomLog };

interface LogEntryCardProps {
  entry: LogEntry;
}

const typeStyles: Record<LogEntry["type"], { bg: string; label: string }> = {
  meal: { bg: "bg-orange-100 text-orange-700", label: "Meal" },
  stool: { bg: "bg-amber-100 text-amber-700", label: "Stool" },
  context: { bg: "bg-purple-100 text-purple-700", label: "Context" },
  symptom: { bg: "bg-red-100 text-red-700", label: "Symptom" },
};

function MealSummary({ data }: { data: MealLog }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900 truncate">{data.description}</p>
      {data.fodmap_flags.length > 0 && (
        <p className="text-xs text-gray-500 mt-0.5">
          FODMAP: {data.fodmap_flags.join(", ")}
        </p>
      )}
    </div>
  );
}

function StoolSummary({ data }: { data: StoolLog }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900">Bristol {data.bristol_type}</p>
      {data.pain_score !== null && (
        <p className="text-xs text-gray-500 mt-0.5">
          Pain: {data.pain_score}/10
        </p>
      )}
    </div>
  );
}

function ContextSummary({ data }: { data: ContextLog }) {
  const parts: string[] = [];
  if (data.stress_score !== null) parts.push(`Stress: ${data.stress_score}/10`);
  if (data.sleep_hours !== null) parts.push(`Sleep: ${data.sleep_hours}h`);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900">
        {parts.length > 0 ? parts.join(" · ") : "Context logged"}
      </p>
    </div>
  );
}

function SymptomSummary({ data }: { data: SymptomLog }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900">Overall: {data.overall}/10</p>
    </div>
  );
}

export function LogEntryCard({ entry }: LogEntryCardProps) {
  const style = typeStyles[entry.type];
  const time = new Date(entry.data.logged_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      {/* Type badge */}
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${style.bg}`}
      >
        {style.label}
      </span>

      {/* Summary */}
      {entry.type === "meal" && <MealSummary data={entry.data} />}
      {entry.type === "stool" && <StoolSummary data={entry.data} />}
      {entry.type === "context" && <ContextSummary data={entry.data} />}
      {entry.type === "symptom" && <SymptomSummary data={entry.data} />}

      {/* Time */}
      <span className="shrink-0 text-xs text-gray-400">{time}</span>
    </div>
  );
}
