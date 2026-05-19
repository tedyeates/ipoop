import { createErrorResponse } from "../lib/errors.ts";
import { generateUlid, generateTimestamp } from "../lib/ulid.ts";
import {
  validateIntRange,
  validateDecimalRange,
  validateEnum,
  validateString,
  hasErrors,
  type ValidationErrors,
} from "../lib/validate.ts";
import { insertContextLog, type ContextLogRow } from "../db/queries.ts";

const EXERCISE_TYPES = ["none", "walk", "gym", "run", "other"] as const;
const MENSTRUAL_PHASES = ["follicular", "ovulatory", "luteal", "menstrual", "n/a"] as const;

export async function handleContext(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return createErrorResponse("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const data = body as Record<string, unknown>;
  const errors: ValidationErrors = {};

  const stress_score = validateIntRange(data.stress_score, "stress_score", 1, 10, errors);
  const sleep_hours = validateDecimalRange(data.sleep_hours, "sleep_hours", 0, 24, errors);
  const sleep_quality = validateIntRange(data.sleep_quality, "sleep_quality", 1, 5, errors);
  const water_litres = validateDecimalRange(data.water_litres, "water_litres", 0, 20, errors);
  const exercise_type = validateEnum(data.exercise_type, "exercise_type", EXERCISE_TYPES, errors);
  const exercise_duration = validateIntRange(data.exercise_duration, "exercise_duration", 0, 1440, errors);
  const caffeine_mg = validateIntRange(data.caffeine_mg, "caffeine_mg", 0, 2000, errors);
  const alcohol_units = validateDecimalRange(data.alcohol_units, "alcohol_units", 0, 50, errors);
  const medications = validateString(data.medications, "medications", 0, 500, errors);
  const menstrual_phase = validateEnum(data.menstrual_phase, "menstrual_phase", MENSTRUAL_PHASES, errors);
  const notes = validateString(data.notes, "notes", 0, 1000, errors);

  if (hasErrors(errors)) {
    return createErrorResponse("VALIDATION_ERROR", "Validation failed", 400, errors);
  }

  // Require at least one optional field to be provided
  const hasAtLeastOneField = stress_score !== null || sleep_hours !== null ||
    sleep_quality !== null || water_litres !== null || exercise_type !== null ||
    exercise_duration !== null || caffeine_mg !== null || alcohol_units !== null ||
    medications !== null || menstrual_phase !== null || notes !== null;

  if (!hasAtLeastOneField) {
    return createErrorResponse("VALIDATION_ERROR", "At least one field must be provided", 400);
  }

  const row: ContextLogRow = {
    id: generateUlid(),
    logged_at: generateTimestamp(),
    stress_score: stress_score ?? null,
    sleep_hours: sleep_hours ?? null,
    sleep_quality: sleep_quality ?? null,
    water_litres: water_litres ?? null,
    exercise_type: exercise_type ?? null,
    exercise_duration: exercise_duration ?? null,
    caffeine_mg: caffeine_mg ?? null,
    alcohol_units: alcohol_units ?? null,
    medications: medications ?? null,
    menstrual_phase: menstrual_phase ?? null,
    notes: notes ?? null,
  };

  try {
    await insertContextLog(row);
  } catch {
    return createErrorResponse("STORAGE_ERROR", "Failed to store context log", 500);
  }

  return new Response(JSON.stringify(row), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
