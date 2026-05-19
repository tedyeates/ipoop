import { createErrorResponse } from "../lib/errors.ts";
import { generateUlid, generateTimestamp } from "../lib/ulid.ts";
import {
  validateIntRange,
  validateBoolean,
  validateString,
  hasErrors,
  type ValidationErrors,
} from "../lib/validate.ts";
import { insertStoolLog, type StoolLogRow } from "../db/queries.ts";

export async function handleStools(req: Request): Promise<Response> {
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

  const bristol_type = validateIntRange(data.bristol_type, "bristol_type", 1, 7, errors, true);
  const frequency = validateIntRange(data.frequency, "frequency", 1, 20, errors);
  const urgency = validateBoolean(data.urgency, "urgency", errors);
  const pain_score = validateIntRange(data.pain_score, "pain_score", 0, 10, errors);
  const blood = validateBoolean(data.blood, "blood", errors);
  const notes = validateString(data.notes, "notes", 0, 1000, errors);

  if (hasErrors(errors)) {
    return createErrorResponse("VALIDATION_ERROR", "Validation failed", 400, errors);
  }

  const row: StoolLogRow = {
    id: generateUlid(),
    logged_at: generateTimestamp(),
    bristol_type: bristol_type!,
    frequency: frequency ?? null,
    urgency: urgency ?? null,
    pain_score: pain_score ?? null,
    blood: blood ?? null,
    notes: notes ?? null,
  };

  try {
    await insertStoolLog(row);
  } catch {
    return createErrorResponse("STORAGE_ERROR", "Failed to store stool log", 500);
  }

  return new Response(JSON.stringify(row), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
