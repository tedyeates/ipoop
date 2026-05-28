/**
 * Server-side validation utilities for all log entry types.
 *
 * Each validator returns either:
 *   { valid: true, data: cleanedData }
 *   { valid: false, fields: Record<string, string> }
 *
 * Strings are trimmed before validation.
 * Numeric strings are coerced to numbers where appropriate.
 */

// --- Result types ---

export type ValidationSuccess<T> = { valid: true; data: T };
export type ValidationFailure = { valid: false; fields: Record<string, string> };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// --- Cleaned data shapes ---

export interface CleanedMeal {
  description: string;
  meal_type: string | null;
  fodmap_flags: string;
  portion_size: string | null;
  eating_speed: string | null;
}

export interface CleanedStool {
  bristol_type: number;
  frequency: number | null;
  urgency: number | null;
  pain_score: number | null;
  blood: number | null;
  notes: string | null;
}

export interface CleanedContext {
  stress_score: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_litres: number | null;
  exercise_type: string | null;
  exercise_duration: number | null;
  caffeine_mg: number | null;
  alcohol_units: number | null;
  medications: string | null;
  menstrual_phase: string | null;
  notes: string | null;
}

export interface CleanedSymptom {
  bloating: number;
  cramping: number;
  nausea: number;
  urgency: number;
  fatigue: number;
  overall: number;
  notes: string | null;
}

// --- Individual field validators (exported for reuse in tests) ---

/** Trim string, return null if empty/undefined. */
export function trimOrNull(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** Coerce value to number, return null if undefined/null/empty string. NaN → null. */
export function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/** Validate required string: non-empty after trim, max length. */
export function validateRequiredString(
  value: unknown,
  maxLen: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value == null || value === "") {
    return { ok: false, error: "Required" };
  }
  const s = String(value).trim();
  if (s.length === 0) {
    return { ok: false, error: "Required" };
  }
  if (s.length > maxLen) {
    return { ok: false, error: `Must be ${maxLen} characters or less` };
  }
  return { ok: true, value: s };
}

/** Validate optional string: if present, trim and check max length. */
export function validateOptionalString(
  value: unknown,
  maxLen: number,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  const s = String(value).trim();
  if (s.length === 0) return { ok: true, value: null };
  if (s.length > maxLen) {
    return { ok: false, error: `Must be ${maxLen} characters or less` };
  }
  return { ok: true, value: s };
}

/** Validate enum field (optional). Returns null if not provided. */
export function validateEnum(
  value: unknown,
  allowed: readonly string[],
  fieldName: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  const s = String(value).trim();
  if (s.length === 0) return { ok: true, value: null };
  if (!allowed.includes(s)) {
    return { ok: false, error: `Invalid ${fieldName}` };
  }
  return { ok: true, value: s };
}

/** Validate required integer in range. */
export function validateRequiredInt(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (value == null || value === "") {
    return { ok: false, error: `${fieldName} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, error: `${fieldName} must be an integer` };
  }
  if (n < min || n > max) {
    return { ok: false, error: `${fieldName} must be ${min}–${max}` };
  }
  return { ok: true, value: n };
}

/** Validate optional integer in range. Returns null if not provided. */
export function validateOptionalInt(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, error: `${fieldName} must be an integer` };
  }
  if (n < min || n > max) {
    return { ok: false, error: `${fieldName} must be ${min}–${max}` };
  }
  return { ok: true, value: n };
}

/** Validate optional number (decimal allowed) in range. Returns null if not provided. */
export function validateOptionalNumber(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return { ok: false, error: `${fieldName} must be a number` };
  }
  if (n < min || n > max) {
    return { ok: false, error: `${fieldName} must be ${min}–${max}` };
  }
  return { ok: true, value: n };
}

/** Validate optional boolean (accepts 0, 1, true, false). Returns 0|1|null. */
export function validateOptionalBool(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (value === 0 || value === "0" || value === false) return { ok: true, value: 0 };
  if (value === 1 || value === "1" || value === true) return { ok: true, value: 1 };
  return { ok: false, error: "Must be 0 or 1" };
}

/**
 * Validate FODMAP flags string.
 * Accepts a string where each char is one of F,O,D,M,P — no duplicates.
 * Also accepts an array of single chars for convenience.
 * Returns the validated string or empty string if not provided.
 */
export function validateFodmapFlags(
  value: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value == null || value === "") return { ok: true, value: "" };

  let chars: string[];
  if (Array.isArray(value)) {
    chars = value.map((v) => String(v).trim().toUpperCase());
  } else {
    const s = String(value).trim().toUpperCase();
    if (s.length === 0) return { ok: true, value: "" };
    chars = s.split("");
  }

  const allowed = new Set(["F", "O", "D", "M", "P"]);
  const seen = new Set<string>();

  for (const c of chars) {
    if (!allowed.has(c)) {
      return { ok: false, error: `Invalid FODMAP flag: ${c}` };
    }
    if (seen.has(c)) {
      return { ok: false, error: `Duplicate FODMAP flag: ${c}` };
    }
    seen.add(c);
  }

  return { ok: true, value: chars.join("") };
}

// --- Composite validators ---

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const PORTION_SIZES = ["small", "medium", "large"] as const;
const EATING_SPEEDS = ["slow", "normal", "fast"] as const;
const EXERCISE_TYPES = ["none", "walk", "gym", "run", "other"] as const;
const MENSTRUAL_PHASES = ["follicular", "ovulatory", "luteal", "menstrual", "n/a"] as const;

/** Validate a meal log request body. */
export function validateMeal(body: Record<string, unknown>): ValidationResult<CleanedMeal> {
  const fields: Record<string, string> = {};

  // description — required, max 500
  const desc = validateRequiredString(body.description, 500);
  if (!desc.ok) fields.description = desc.error;

  // meal_type — optional enum
  const mt = validateEnum(body.meal_type, MEAL_TYPES, "meal type");
  if (!mt.ok) fields.meal_type = mt.error;

  // fodmap_flags — optional, validated chars
  const ff = validateFodmapFlags(body.fodmap_flags);
  if (!ff.ok) fields.fodmap_flags = ff.error;

  // portion_size — optional enum
  const ps = validateEnum(body.portion_size, PORTION_SIZES, "portion size");
  if (!ps.ok) fields.portion_size = ps.error;

  // eating_speed — optional enum
  const es = validateEnum(body.eating_speed, EATING_SPEEDS, "eating speed");
  if (!es.ok) fields.eating_speed = es.error;

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields };
  }

  return {
    valid: true,
    data: {
      description: (desc as { ok: true; value: string }).value,
      meal_type: (mt as { ok: true; value: string | null }).value,
      fodmap_flags: (ff as { ok: true; value: string }).value,
      portion_size: (ps as { ok: true; value: string | null }).value,
      eating_speed: (es as { ok: true; value: string | null }).value,
    },
  };
}

/** Validate a stool log request body. */
export function validateStool(body: Record<string, unknown>): ValidationResult<CleanedStool> {
  const fields: Record<string, string> = {};

  // bristol_type — required int 1-7
  const bt = validateRequiredInt(body.bristol_type, 1, 7, "Bristol type");
  if (!bt.ok) fields.bristol_type = bt.error;

  // frequency — optional int 1-20
  const freq = validateOptionalInt(body.frequency, 1, 20, "Frequency");
  if (!freq.ok) fields.frequency = freq.error;

  // urgency — optional bool
  const urg = validateOptionalBool(body.urgency);
  if (!urg.ok) fields.urgency = urg.error;

  // pain_score — optional int 0-10
  const ps = validateOptionalInt(body.pain_score, 0, 10, "Pain score");
  if (!ps.ok) fields.pain_score = ps.error;

  // blood — optional bool
  const bl = validateOptionalBool(body.blood);
  if (!bl.ok) fields.blood = bl.error;

  // notes — optional string max 1000
  const notes = validateOptionalString(body.notes, 1000);
  if (!notes.ok) fields.notes = notes.error;

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields };
  }

  return {
    valid: true,
    data: {
      bristol_type: (bt as { ok: true; value: number }).value,
      frequency: (freq as { ok: true; value: number | null }).value,
      urgency: (urg as { ok: true; value: number | null }).value,
      pain_score: (ps as { ok: true; value: number | null }).value,
      blood: (bl as { ok: true; value: number | null }).value,
      notes: (notes as { ok: true; value: string | null }).value,
    },
  };
}

/** Validate a context log request body. At least one field must be provided. */
export function validateContext(body: Record<string, unknown>): ValidationResult<CleanedContext> {
  const fields: Record<string, string> = {};

  // stress_score — optional int 1-10
  const stress = validateOptionalInt(body.stress_score, 1, 10, "Stress");
  if (!stress.ok) fields.stress_score = stress.error;

  // sleep_hours — optional number 0-24
  const sleepH = validateOptionalNumber(body.sleep_hours, 0, 24, "Sleep hours");
  if (!sleepH.ok) fields.sleep_hours = sleepH.error;

  // sleep_quality — optional int 1-5
  const sleepQ = validateOptionalInt(body.sleep_quality, 1, 5, "Sleep quality");
  if (!sleepQ.ok) fields.sleep_quality = sleepQ.error;

  // water_litres — optional number 0-20
  const water = validateOptionalNumber(body.water_litres, 0, 20, "Water");
  if (!water.ok) fields.water_litres = water.error;

  // exercise_type — optional enum
  const exType = validateEnum(body.exercise_type, EXERCISE_TYPES, "exercise type");
  if (!exType.ok) fields.exercise_type = exType.error;

  // exercise_duration — optional int 0-1440
  const exDur = validateOptionalInt(body.exercise_duration, 0, 1440, "Exercise duration");
  if (!exDur.ok) fields.exercise_duration = exDur.error;

  // caffeine_mg — optional int 0-2000
  const caff = validateOptionalInt(body.caffeine_mg, 0, 2000, "Caffeine");
  if (!caff.ok) fields.caffeine_mg = caff.error;

  // alcohol_units — optional number 0-50
  const alc = validateOptionalNumber(body.alcohol_units, 0, 50, "Alcohol");
  if (!alc.ok) fields.alcohol_units = alc.error;

  // medications — optional string max 500
  const meds = validateOptionalString(body.medications, 500);
  if (!meds.ok) fields.medications = meds.error;

  // menstrual_phase — optional enum
  const menst = validateEnum(body.menstrual_phase, MENSTRUAL_PHASES, "menstrual phase");
  if (!menst.ok) fields.menstrual_phase = menst.error;

  // notes — optional string max 1000
  const notes = validateOptionalString(body.notes, 1000);
  if (!notes.ok) fields.notes = notes.error;

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields };
  }

  // Build cleaned data
  const data: CleanedContext = {
    stress_score: (stress as { ok: true; value: number | null }).value,
    sleep_hours: (sleepH as { ok: true; value: number | null }).value,
    sleep_quality: (sleepQ as { ok: true; value: number | null }).value,
    water_litres: (water as { ok: true; value: number | null }).value,
    exercise_type: (exType as { ok: true; value: string | null }).value,
    exercise_duration: (exDur as { ok: true; value: number | null }).value,
    caffeine_mg: (caff as { ok: true; value: number | null }).value,
    alcohol_units: (alc as { ok: true; value: number | null }).value,
    medications: (meds as { ok: true; value: string | null }).value,
    menstrual_phase: (menst as { ok: true; value: string | null }).value,
    notes: (notes as { ok: true; value: string | null }).value,
  };

  // At least one field must be non-null
  const hasValue = Object.values(data).some((v) => v != null);
  if (!hasValue) {
    return { valid: false, fields: { _form: "At least one field is required" } };
  }

  return { valid: true, data };
}

/** Validate a symptom log request body. All 6 severity fields required. */
export function validateSymptom(body: Record<string, unknown>): ValidationResult<CleanedSymptom> {
  const fields: Record<string, string> = {};

  const SEVERITY_FIELDS = ["bloating", "cramping", "nausea", "urgency", "fatigue", "overall"] as const;

  const values: Record<string, number> = {};

  for (const f of SEVERITY_FIELDS) {
    const result = validateRequiredInt(body[f], 0, 10, f);
    if (!result.ok) {
      fields[f] = result.error;
    } else {
      values[f] = result.value;
    }
  }

  // notes — optional string max 1000
  const notes = validateOptionalString(body.notes, 1000);
  if (!notes.ok) fields.notes = notes.error;

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields };
  }

  return {
    valid: true,
    data: {
      bloating: values.bloating,
      cramping: values.cramping,
      nausea: values.nausea,
      urgency: values.urgency,
      fatigue: values.fatigue,
      overall: values.overall,
      notes: (notes as { ok: true; value: string | null }).value,
    },
  };
}
