import { useNavigate } from "react-router-dom";
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import { QuickLogButton } from "../components/QuickLogButton";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data!;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Stats */}
      <section className="grid grid-cols-3 gap-3" aria-label="Today's summary">
        <StatCard
          label="Today's Logs"
          value={summary.todayLogCount > 0 ? String(summary.todayLogCount) : "—"}
          empty={summary.todayLogCount === 0}
        />
        <StatCard
          label="Symptom Score"
          value={summary.recentSymptomScore !== null ? `${summary.recentSymptomScore}/10` : "—"}
          empty={summary.recentSymptomScore === null}
        />
        <StatCard
          label="Bristol Type"
          value={summary.recentBristolType !== null ? `Type ${summary.recentBristolType}` : "—"}
          empty={summary.recentBristolType === null}
        />
      </section>

      {/* Hypothesis Teaser */}
      <section aria-label="Top trigger hypothesis">
        {summary.topHypothesis ? (
          <div
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2 cursor-pointer"
            onClick={() => navigate("/hypotheses")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/hypotheses");
            }}
          >
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Top Trigger
            </h2>
            <p className="text-lg font-semibold text-gray-900">
              {summary.topHypothesis.trigger_name}
            </p>
            <p className="text-sm text-gray-600">
              FODMAP: {summary.topHypothesis.fodmap_category || "—"}
            </p>
            <ConfidenceBadge
              score={summary.topHypothesis.confidence_score}
              label={summary.topHypothesis.confidence_label}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center space-y-3">
            <p className="text-gray-500">No trigger hypotheses yet</p>
            <button
              onClick={() => navigate("/hypotheses")}
              className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Run AI Review
            </button>
          </div>
        )}
      </section>

      {/* Quick Log Buttons */}
      <section aria-label="Quick log actions" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Quick Log
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLogButton
            label="Meal"
            icon={<MealIcon />}
            onClick={() => navigate("/log/meal")}
          />
          <QuickLogButton
            label="Stool"
            icon={<StoolIcon />}
            onClick={() => navigate("/log/stool")}
          />
          <QuickLogButton
            label="Context"
            icon={<ContextIcon />}
            onClick={() => navigate("/log/context")}
          />
          <QuickLogButton
            label="Symptoms"
            icon={<SymptomIcon />}
            onClick={() => navigate("/log/symptoms")}
          />
        </div>
      </section>
    </div>
  );
}

/* Stat card sub-component */
function StatCard({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${empty ? "text-gray-300" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

/* Simple inline SVG icons */
function MealIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}

function StoolIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.14-3.36 7.5-7.5 7.5S4.5 16.14 4.5 12 7.86 4.5 12 4.5s7.5 3.36 7.5 7.5z" />
    </svg>
  );
}

function ContextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function SymptomIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
