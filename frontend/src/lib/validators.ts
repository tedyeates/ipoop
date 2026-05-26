export type ValidationErrors = Record<string, string>;

export function validateMeal(data: {
  description?: string;
  meal_type?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const desc = data.description?.trim() ?? "";
  if (!desc) errors.description = "Description is required";
  else if (desc.length > 500)
    errors.description = "Description must be 500 characters or less";
  if (
    data.meal_type &&
    !["breakfast", "lunch", "dinner", "snack"].includes(data.meal_type)
  )
    errors.meal_type = "Invalid meal type";
  return errors;
}

export function validateStool(data: {
  bristol_type?: number;
  pain_score?: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (data.bristol_type == null)
    errors.bristol_type = "Bristol type is required";
  else if (data.bristol_type < 1 || data.bristol_type > 7)
    errors.bristol_type = "Bristol type must be 1–7";
  if (data.pain_score != null && (data.pain_score < 0 || data.pain_score > 10))
    errors.pain_score = "Pain score must be 0–10";
  return errors;
}

export function validateContext(
  data: Record<string, unknown>,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const fields = [
    "stress_score",
    "sleep_hours",
    "sleep_quality",
    "water_litres",
    "exercise_type",
    "exercise_duration",
    "caffeine_mg",
    "alcohol_units",
    "medications",
    "menstrual_phase",
    "notes",
  ];
  const hasAny = fields.some(
    (f) => data[f] != null && data[f] !== "",
  );
  if (!hasAny) errors._form = "At least one field is required";

  const s = data.stress_score as number | undefined;
  if (s != null && (s < 1 || s > 10))
    errors.stress_score = "Stress must be 1–10";
  const sq = data.sleep_quality as number | undefined;
  if (sq != null && (sq < 1 || sq > 5))
    errors.sleep_quality = "Sleep quality must be 1–5";
  const sh = data.sleep_hours as number | undefined;
  if (sh != null && (sh < 0 || sh > 24))
    errors.sleep_hours = "Sleep hours must be 0–24";
  const w = data.water_litres as number | undefined;
  if (w != null && (w < 0 || w > 20))
    errors.water_litres = "Water must be 0–20 litres";
  const ed = data.exercise_duration as number | undefined;
  if (ed != null && (ed < 0 || ed > 1440))
    errors.exercise_duration = "Duration must be 0–1440 minutes";
  const c = data.caffeine_mg as number | undefined;
  if (c != null && (c < 0 || c > 2000))
    errors.caffeine_mg = "Caffeine must be 0–2000mg";
  const a = data.alcohol_units as number | undefined;
  if (a != null && (a < 0 || a > 50))
    errors.alcohol_units = "Alcohol must be 0–50 units";
  return errors;
}

export function validateSymptoms(data: {
  bloating?: number;
  cramping?: number;
  nausea?: number;
  urgency?: number;
  fatigue?: number;
  overall?: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const fields = [
    "bloating",
    "cramping",
    "nausea",
    "urgency",
    "fatigue",
    "overall",
  ] as const;
  for (const f of fields) {
    const v = data[f];
    if (v == null) errors[f] = `${f} is required`;
    else if (v < 0 || v > 10) errors[f] = `${f} must be 0–10`;
  }
  return errors;
}
