import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BristolPicker } from "../components/BristolPicker";
import { SeveritySlider } from "../components/SeveritySlider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";
import { createStool } from "../lib/api";
import { validateStool, type ValidationErrors } from "../lib/validators";
import type { StoolLog, CreateStoolRequest } from "../lib/types";

export default function StoolLogPage() {
  const navigate = useNavigate();
  const { loading, error, execute } = useApi<StoolLog>();

  const [bristolType, setBristolType] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null);
  const [frequency, setFrequency] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [painScore, setPainScore] = useState(0);
  const [painTouched, setPainTouched] = useState(false);
  const [blood, setBlood] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const freqNum = frequency.trim() ? Number(frequency) : undefined;
    const validationErrors = validateStool({
      bristol_type: bristolType ?? undefined,
      pain_score: painTouched ? painScore : undefined,
      frequency: freqNum,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const req: CreateStoolRequest = {
      bristol_type: bristolType!,
    };
    if (freqNum != null) req.frequency = freqNum;
    if (urgency) req.urgency = true;
    if (painTouched) req.pain_score = painScore;
    if (blood) req.blood = true;
    if (notes.trim()) req.notes = notes.trim();

    try {
      await execute(() => createStool(req));
      navigate("/");
    } catch {
      // error state handled by useApi
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Log Stool</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bristol Type Picker */}
        <div>
          <BristolPicker
            value={bristolType}
            onChange={(type) => {
              setBristolType(type);
              if (errors.bristol_type) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.bristol_type;
                  return next;
                });
              }
            }}
            disabled={loading}
          />
          {errors.bristol_type && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.bristol_type}
            </p>
          )}
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
            Frequency (times today)
          </label>
          <input
            id="frequency"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            disabled={loading}
            placeholder="1–20"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.frequency}
            </p>
          )}
        </div>

        {/* Urgency Toggle */}
        <div className="flex items-center min-h-[44px]">
          <label htmlFor="urgency" className="flex items-center gap-3 cursor-pointer">
            <input
              id="urgency"
              type="checkbox"
              checked={urgency}
              onChange={(e) => setUrgency(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 min-w-[44px] min-h-[44px] accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
              style={{ width: 20, height: 20, minWidth: 44, minHeight: 44 }}
            />
            <span className="text-sm font-medium text-gray-700">Urgency</span>
          </label>
        </div>

        {/* Pain Score */}
        <div>
          <SeveritySlider
            label="Pain Score"
            value={painScore}
            onChange={(val) => {
              setPainScore(val);
              setPainTouched(true);
            }}
            min={0}
            max={10}
            disabled={loading}
          />
          {!painTouched && (
            <p className="text-xs text-gray-400 mt-1">Optional — slide to set</p>
          )}
          {errors.pain_score && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.pain_score}
            </p>
          )}
        </div>

        {/* Blood Toggle */}
        <div className="flex items-center min-h-[44px]">
          <label htmlFor="blood" className="flex items-center gap-3 cursor-pointer">
            <input
              id="blood"
              type="checkbox"
              checked={blood}
              onChange={(e) => setBlood(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
              style={{ width: 20, height: 20, minWidth: 44, minHeight: 44 }}
            />
            <span className="text-sm font-medium text-gray-700">Blood present</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            maxLength={1000}
            rows={3}
            placeholder="Optional notes (max 1000 chars)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{notes.length}/1000</p>
        </div>

        {/* API Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] bg-indigo-600 text-white font-medium rounded-lg py-3 px-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Saving…
            </>
          ) : (
            "Save Stool Log"
          )}
        </button>
      </form>
    </div>
  );
}
