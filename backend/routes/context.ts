/**
 * Context log route handler.
 * POST /api/context — create a context log entry.
 * GET  /api/context — retrieve context logs (optional ?since= filter).
 */

import { validateContext } from "../lib/validate.ts";
import { insertContext, getContext } from "../db/queries.ts";
import { generateUlid, nowISO } from "../lib/ulid.ts";
import { validationError, methodNotAllowed, serverError } from "../lib/errors.ts";

export async function handleContext(req: Request): Promise<Response> {
  if (req.method === "POST") return handlePost(req);
  if (req.method === "GET") return handleGet(req);
  return methodNotAllowed(`Method ${req.method} not allowed on /api/context`);
}

async function handlePost(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body", { _form: "Request body must be valid JSON" });
  }

  const result = validateContext(body);
  if (!result.valid) {
    return validationError("Validation failed", result.fields);
  }

  const { data } = result;
  const id = generateUlid();
  const logged_at = nowISO();

  try {
    await insertContext({
      id,
      logged_at,
      stress_score: data.stress_score,
      sleep_hours: data.sleep_hours,
      sleep_quality: data.sleep_quality,
      water_litres: data.water_litres,
      exercise_type: data.exercise_type,
      exercise_duration: data.exercise_duration,
      caffeine_mg: data.caffeine_mg,
      alcohol_units: data.alcohol_units,
      medications: data.medications,
      menstrual_phase: data.menstrual_phase,
      notes: data.notes,
    });
  } catch (err) {
    console.error("Failed to insert context:", err);
    return serverError();
  }

  return new Response(
    JSON.stringify({ id, logged_at }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const since = url.searchParams.get("since") ?? undefined;

  try {
    const rows = await getContext(since ? { since } : undefined);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to get context:", err);
    return serverError();
  }
}
