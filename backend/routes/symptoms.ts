/**
 * Symptom log route handler.
 * POST /api/symptoms — create a symptom log entry.
 * GET  /api/symptoms — retrieve symptom logs (optional ?since= filter).
 */

import { validateSymptom } from "../lib/validate.ts";
import { insertSymptom, getSymptoms } from "../db/queries.ts";
import { generateUlid, nowISO } from "../lib/ulid.ts";
import { validationError, methodNotAllowed, serverError } from "../lib/errors.ts";

export async function handleSymptoms(req: Request): Promise<Response> {
  if (req.method === "POST") return handlePost(req);
  if (req.method === "GET") return handleGet(req);
  return methodNotAllowed(`Method ${req.method} not allowed on /api/symptoms`);
}

async function handlePost(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body", { _form: "Request body must be valid JSON" });
  }

  const result = validateSymptom(body);
  if (!result.valid) {
    return validationError("Validation failed", result.fields);
  }

  const { data } = result;
  const id = generateUlid();
  const logged_at = nowISO();

  try {
    await insertSymptom({
      id,
      logged_at,
      bloating: data.bloating,
      cramping: data.cramping,
      nausea: data.nausea,
      urgency: data.urgency,
      fatigue: data.fatigue,
      overall: data.overall,
      notes: data.notes,
    });
  } catch (err) {
    console.error("Failed to insert symptom:", err);
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
    const rows = await getSymptoms(since ? { since } : undefined);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to get symptoms:", err);
    return serverError();
  }
}
