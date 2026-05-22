import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SeveritySlider } from "../components/SeveritySlider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";
import { createSymptom } from "../lib/api";
import { validateSymptoms, type ValidationErrors } from "../lib/validators";
import type { SymptomLog } from "../lib/types";

const SYMPTOM_FIELDS = [
  "bloating",
  "cramping",
  "nausea",
  "urgency",
  "fatigue",
  "overall",
] as const;

type SymptomField = (typeof SYMPTOM_FIELDS)[number];

type SymptomValues = Record<SymptomField, number | null>;

export default function SymptomLogPage() {
  const navigate = useNavigate();
  const { loading, execute } = useApi<SymptomLog>();

  const [values, setValues] = useState<SymptomValues>({
    bloating: null,
    cramping: null,
    nausea: null,
    urgency: null,
    fatigue: null,
    overall: null,
  });

  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState(false);

  function handleSliderChange(field: SymptomField, value: number) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field on interaction
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Build validation payload — null values become undefined for validator
    const validationData: Record<string, number | undefined> = {};
    for (const f of SYMPTOM_FIELDS) {
      validationData[f] = values[f] ?? undefined;
    }

    const validationErrors = validateSymptoms(validationData);

    // Check notes length
    if (notes.length > 1000) {
      validationErrors.notes = "Notes must be 1000 characters or less";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await execute(() =>
        createSymptom({
          bloating: values.bloating!,
          cramping: values.cramping!,
          nausea: values.nausea!,
          urgency: values.urgency!,
          fatigue: values.fatigue!,
          overall: values.overall!,
          notes: notes.trim() || undefined,
        }),
      );
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch {
      // error state handled by useApi
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Log Symptoms</h1>

      {success && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium"
        >
          Symptoms logged successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Severity sliders */}
        <div className="space-y-4">
          {SYMPTOM_FIELDS.map((field) => (
            <div key={field}>
              {values[field] === null ? (
                // Unset state — show placeholder button to activate slider
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {field}
                    </span>
                    <span className="text-sm text-gray-400">Not set</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSliderChange(field, 5)}
                    className="w-full h-11 min-h-[44px] bg-gray-100 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                    aria-label={`Set ${field} severity`}
                  >
                    Tap to set severity
                  </button>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0</span>
                    <span>10</span>
                  </div>
                </div>
              ) : (
                <SeveritySlider
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={values[field]}
                  onChange={(v) => handleSliderChange(field, v)}
                  min={0}
                  max={10}
                  disabled={loading}
                />
              )}
              {errors[field] && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  {errors[field]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label
            htmlFor="symptom-notes"
            className="text-sm font-medium text-gray-700"
          >
            Notes{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="symptom-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            disabled={loading}
            placeholder="Any additional details..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.notes && (
              <p className="text-red-600" role="alert">
                {errors.notes}
              </p>
            )}
            <span className="ml-auto">{notes.length}/1000</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] bg-indigo-600 text-white font-medium rounded-lg py-3 px-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Saving...
            </span>
          ) : (
            "Log Symptoms"
          )}
        </button>
      </form>
    </div>
  );
}
