import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SeveritySlider } from "../components/SeveritySlider";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";
import { createContext } from "../lib/api";
import { validateContext, type ValidationErrors } from "../lib/validators";
import type { ContextLog, CreateContextRequest } from "../lib/types";

export default function ContextLogPage() {
  const navigate = useNavigate();
  const { loading, error: apiError, execute } = useApi<ContextLog>();

  // Track which slider fields user has interacted with
  const [stressTouched, setStressTouched] = useState(false);
  const [sleepQualityTouched, setSleepQualityTouched] = useState(false);

  // Slider values (defaults for display only — not submitted unless touched)
  const [stressScore, setStressScore] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(3);

  // Numeric inputs
  const [sleepHours, setSleepHours] = useState("");
  const [waterLitres, setWaterLitres] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");
  const [caffeineMg, setCaffeineMg] = useState("");
  const [alcoholUnits, setAlcoholUnits] = useState("");

  // Select fields
  const [exerciseType, setExerciseType] = useState("");
  const [menstrualPhase, setMenstrualPhase] = useState("");

  // Text fields
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");

  // Validation
  const [errors, setErrors] = useState<ValidationErrors>({});

  function buildRequest(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (stressTouched) data.stress_score = stressScore;
    if (sleepHours !== "") data.sleep_hours = parseFloat(sleepHours);
    if (sleepQualityTouched) data.sleep_quality = sleepQuality;
    if (waterLitres !== "") data.water_litres = parseFloat(waterLitres);
    if (exerciseType !== "") data.exercise_type = exerciseType;
    if (exerciseDuration !== "") data.exercise_duration = parseInt(exerciseDuration, 10);
    if (caffeineMg !== "") data.caffeine_mg = parseInt(caffeineMg, 10);
    if (alcoholUnits !== "") data.alcohol_units = parseFloat(alcoholUnits);
    if (medications.trim() !== "") data.medications = medications.trim();
    if (menstrualPhase !== "") data.menstrual_phase = menstrualPhase;
    if (notes.trim() !== "") data.notes = notes.trim();
    return data;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = buildRequest();
    const validationErrors = validateContext(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    try {
      await execute(() => createContext(data as CreateContextRequest));
      navigate("/");
    } catch {
      // error state handled by useApi
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Log Context</h1>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Form-level error */}
        {errors._form && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3" role="alert">
            {errors._form}
          </p>
        )}

        {/* API error */}
        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3" role="alert">
            {apiError}
          </p>
        )}

        {/* Stress Score */}
        <div>
          <SeveritySlider
            label="Stress"
            value={stressScore}
            onChange={(v) => { setStressTouched(true); setStressScore(v); }}
            min={1}
            max={10}
            disabled={loading}
          />
          {!stressTouched && (
            <p className="text-xs text-gray-400 mt-1">Slide to set stress level</p>
          )}
          {errors.stress_score && (
            <p className="text-sm text-red-600 mt-1">{errors.stress_score}</p>
          )}
        </div>

        {/* Sleep Hours */}
        <div>
          <label htmlFor="sleep-hours" className="block text-sm font-medium text-gray-700 mb-1">
            Sleep Hours
          </label>
          <input
            id="sleep-hours"
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            disabled={loading}
            placeholder="e.g. 7.5"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.sleep_hours && (
            <p className="text-sm text-red-600 mt-1">{errors.sleep_hours}</p>
          )}
        </div>

        {/* Sleep Quality */}
        <div>
          <SeveritySlider
            label="Sleep Quality"
            value={sleepQuality}
            onChange={(v) => { setSleepQualityTouched(true); setSleepQuality(v); }}
            min={1}
            max={5}
            disabled={loading}
          />
          {!sleepQualityTouched && (
            <p className="text-xs text-gray-400 mt-1">Slide to set sleep quality</p>
          )}
          {errors.sleep_quality && (
            <p className="text-sm text-red-600 mt-1">{errors.sleep_quality}</p>
          )}
        </div>

        {/* Water Litres */}
        <div>
          <label htmlFor="water-litres" className="block text-sm font-medium text-gray-700 mb-1">
            Water (litres)
          </label>
          <input
            id="water-litres"
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={waterLitres}
            onChange={(e) => setWaterLitres(e.target.value)}
            disabled={loading}
            placeholder="e.g. 2.0"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.water_litres && (
            <p className="text-sm text-red-600 mt-1">{errors.water_litres}</p>
          )}
        </div>

        {/* Exercise Type */}
        <div>
          <label htmlFor="exercise-type" className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Type
          </label>
          <select
            id="exercise-type"
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
            disabled={loading}
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 bg-white"
          >
            <option value="">— Select —</option>
            <option value="none">None</option>
            <option value="walk">Walk</option>
            <option value="gym">Gym</option>
            <option value="run">Run</option>
            <option value="other">Other</option>
          </select>
          {errors.exercise_type && (
            <p className="text-sm text-red-600 mt-1">{errors.exercise_type}</p>
          )}
        </div>

        {/* Exercise Duration */}
        <div>
          <label htmlFor="exercise-duration" className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Duration (minutes)
          </label>
          <input
            id="exercise-duration"
            type="number"
            min={0}
            max={1440}
            step={1}
            value={exerciseDuration}
            onChange={(e) => setExerciseDuration(e.target.value)}
            disabled={loading}
            placeholder="e.g. 30"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.exercise_duration && (
            <p className="text-sm text-red-600 mt-1">{errors.exercise_duration}</p>
          )}
        </div>

        {/* Caffeine */}
        <div>
          <label htmlFor="caffeine-mg" className="block text-sm font-medium text-gray-700 mb-1">
            Caffeine (mg)
          </label>
          <input
            id="caffeine-mg"
            type="number"
            min={0}
            max={2000}
            step={1}
            value={caffeineMg}
            onChange={(e) => setCaffeineMg(e.target.value)}
            disabled={loading}
            placeholder="e.g. 200"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.caffeine_mg && (
            <p className="text-sm text-red-600 mt-1">{errors.caffeine_mg}</p>
          )}
        </div>

        {/* Alcohol Units */}
        <div>
          <label htmlFor="alcohol-units" className="block text-sm font-medium text-gray-700 mb-1">
            Alcohol (units)
          </label>
          <input
            id="alcohol-units"
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={alcoholUnits}
            onChange={(e) => setAlcoholUnits(e.target.value)}
            disabled={loading}
            placeholder="e.g. 2.0"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.alcohol_units && (
            <p className="text-sm text-red-600 mt-1">{errors.alcohol_units}</p>
          )}
        </div>

        {/* Medications */}
        <div>
          <label htmlFor="medications" className="block text-sm font-medium text-gray-700 mb-1">
            Medications
          </label>
          <input
            id="medications"
            type="text"
            maxLength={500}
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            disabled={loading}
            placeholder="e.g. Ibuprofen 400mg"
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          {errors.medications && (
            <p className="text-sm text-red-600 mt-1">{errors.medications}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{medications.length}/500</p>
        </div>

        {/* Menstrual Phase */}
        <div>
          <label htmlFor="menstrual-phase" className="block text-sm font-medium text-gray-700 mb-1">
            Menstrual Phase
          </label>
          <select
            id="menstrual-phase"
            value={menstrualPhase}
            onChange={(e) => setMenstrualPhase(e.target.value)}
            disabled={loading}
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 bg-white"
          >
            <option value="">— Select —</option>
            <option value="follicular">Follicular</option>
            <option value="ovulatory">Ovulatory</option>
            <option value="luteal">Luteal</option>
            <option value="menstrual">Menstrual</option>
            <option value="n/a">N/A</option>
          </select>
          {errors.menstrual_phase && (
            <p className="text-sm text-red-600 mt-1">{errors.menstrual_phase}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            maxLength={1000}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Anything else relevant..."
            className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 resize-y"
          />
          {errors.notes && (
            <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{notes.length}/1000</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] bg-indigo-600 text-white font-medium rounded-lg py-3 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Save Context"}
        </button>
      </form>
    </div>
  );
}
