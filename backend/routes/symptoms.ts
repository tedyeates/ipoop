import { createErrorResponse } from "../lib/errors.ts";
import { generateUlid, generateTimestamp } from "../lib/ulid.ts";
import {
  validateIntRange,
  validateString,
  hasErrors,
  type ValidationErrors,
} from "../lib/validate.ts";
import { insertSymptomLog, type SymptomLogRow } from "../db/queries.ts";

export async function handleSymptoms(req: Request): Promise<Response> {
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

  const bloating = validateIntRange(data.bloating, "bloating", 0, 10, errors, true);
  const cramping = validateIntRange(data.cramping, "cramping", 0, 10, errors, true);
  const nausea = validateIntRange(data.nausea, "nausea", 0, 10, errors, true);
  const urgency = validateIntRange(data.urgency, "urgency", 0, 10, errors, true);
  const fatigue = validateIntRange(data.fatigue, "fatigue", 0, 10, errors, true);
  const overall = validateIntRange(data.overall, "overall", 0, 10, errors, true);
  const notes = validateString(data.notes, "notes", 0, 1000, errors);

  if (hasErrors(errors)) {
    return createErrorResponse("VALIDATION_ERROR", "Validation failed", 400, errors);
  }

  const row: SymptomLogRow = {
    id: generateUlid(),
    logged_at: generateTimestamp(),
    bloating: bloating!,
    cramping: cramping!,
    nausea: nausea!,
    urgency: urgency!,
    fatigue: fatigue!,
    overall: overall!,
    notes: notes ?? null,
  };

  try {
    await insertSymptomLog(row);
  } catch {
    return createErrorResponse("STORAGE_ERROR", "Failed to store symptom log", 500);
  }

  return new Response(JSON.stringify(row), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
