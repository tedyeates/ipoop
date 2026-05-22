import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhotoCapture } from "../components/PhotoCapture";
import { FodmapCheckboxes } from "../components/FodmapCheckboxes";
import { IngredientBreakdown } from "../components/IngredientBreakdown";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";
import { createMeal, scanIngredients } from "../lib/api";
import { validateMeal } from "../lib/validators";
import type { ValidationErrors } from "../lib/validators";
import type { ScanResponse, CreateMealRequest } from "../lib/types";

type FodmapFlag = "F" | "O" | "D" | "M" | "P";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type PortionSize = "small" | "medium" | "large";
type EatingSpeed = "slow" | "normal" | "fast";

export default function MealLogPage() {
  const navigate = useNavigate();

  // Form state
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<MealType | "">("");
  const [fodmapFlags, setFodmapFlags] = useState<FodmapFlag[]>([]);
  const [portionSize, setPortionSize] = useState<PortionSize | "">("");
  const [eatingSpeed, setEatingSpeed] = useState<EatingSpeed | "">("");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanUsed, setScanUsed] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // API hooks
  const scanApi = useApi<ScanResponse>();
  const submitApi = useApi<unknown>();

  async function handlePhotoCapture(base64: string, mimeType: string) {
    try {
      const result = await scanApi.execute(() =>
        scanIngredients(base64, mimeType),
      );
      if (result) {
        setDescription(result.description);
        setFodmapFlags(result.fodmap_flags);
        setScanResult(result);
        setScanUsed(true);
      }
    } catch {
      // error state handled by useApi
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitSuccess(false);

    const validationErrors = validateMeal({
      description,
      meal_type: mealType || undefined,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const req: CreateMealRequest = {
      description: description.trim(),
      ...(mealType && { meal_type: mealType }),
      ...(fodmapFlags.length > 0 && { fodmap_flags: fodmapFlags }),
      ...(scanResult && { ingredients: scanResult.ingredients }),
      ...(scanResult && { fodmap_detail: scanResult.fodmap_detail }),
      ...(portionSize && { portion_size: portionSize }),
      ...(eatingSpeed && { eating_speed: eatingSpeed }),
      scan_used: scanUsed,
    };

    try {
      await submitApi.execute(() => createMeal(req));
      setSubmitSuccess(true);
      setTimeout(() => navigate("/"), 1000);
    } catch {
      // error state handled by useApi
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Log Meal</h1>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Photo Capture */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Photo Scan (optional)
          </label>
          <PhotoCapture
            onCapture={handlePhotoCapture}
            disabled={scanApi.loading}
          />
          {scanApi.loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              <span>Scanning ingredients…</span>
            </div>
          )}
          {scanApi.error && (
            <p className="text-sm text-red-600" role="alert">
              Scan failed: {scanApi.error}
            </p>
          )}
        </section>

        {/* Scan Results */}
        {scanResult && (
          <section className="space-y-2">
            <IngredientBreakdown scan={scanResult} />
            <p className="text-xs text-gray-500 italic">
              AI-generated suggestions. Not medical advice.
            </p>
          </section>
        )}

        {/* Description */}
        <div className="space-y-1">
          <label
            htmlFor="meal-description"
            className="block text-sm font-medium text-gray-700"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="meal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What did you eat?"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "desc-error" : undefined
            }
          />
          <div className="flex justify-between">
            {errors.description ? (
              <p id="desc-error" className="text-xs text-red-600" role="alert">
                {errors.description}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Meal Type */}
        <div className="space-y-1">
          <label
            htmlFor="meal-type"
            className="block text-sm font-medium text-gray-700"
          >
            Meal Type
          </label>
          <select
            id="meal-type"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType | "")}
            className={`w-full min-h-[44px] rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.meal_type ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!errors.meal_type}
            aria-describedby={
              errors.meal_type ? "meal-type-error" : undefined
            }
          >
            <option value="">Select meal type</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          {errors.meal_type && (
            <p
              id="meal-type-error"
              className="text-xs text-red-600"
              role="alert"
            >
              {errors.meal_type}
            </p>
          )}
        </div>

        {/* FODMAP Flags */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            FODMAP Categories
          </label>
          <FodmapCheckboxes
            selected={fodmapFlags}
            onChange={setFodmapFlags}
            disabled={submitApi.loading}
          />
        </div>

        {/* Portion Size */}
        <div className="space-y-1">
          <label
            htmlFor="portion-size"
            className="block text-sm font-medium text-gray-700"
          >
            Portion Size
          </label>
          <select
            id="portion-size"
            value={portionSize}
            onChange={(e) =>
              setPortionSize(e.target.value as PortionSize | "")
            }
            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select portion size</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Eating Speed */}
        <div className="space-y-1">
          <label
            htmlFor="eating-speed"
            className="block text-sm font-medium text-gray-700"
          >
            Eating Speed
          </label>
          <select
            id="eating-speed"
            value={eatingSpeed}
            onChange={(e) =>
              setEatingSpeed(e.target.value as EatingSpeed | "")
            }
            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select eating speed</option>
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        {/* Submit Error */}
        {submitApi.error && (
          <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3" role="alert">
            Failed to save: {submitApi.error}
          </p>
        )}

        {/* Success Feedback */}
        {submitSuccess && (
          <p
            className="text-sm text-green-700 rounded-lg bg-green-50 p-3"
            role="status"
          >
            Meal logged successfully! Redirecting…
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitApi.loading || submitSuccess}
          className="w-full min-h-[44px] rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitApi.loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving…</span>
            </>
          ) : (
            "Log Meal"
          )}
        </button>
      </form>
    </div>
  );
}
