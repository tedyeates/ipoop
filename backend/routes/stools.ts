/**
 * Stool log route handler.
 * POST /api/stools — create a stool log entry.
 * GET  /api/stools — retrieve stool logs (optional ?since= filter).
 */

import { validateStool } from "../lib/validate.ts";
import { insertStool, getStools } from "../db/queries.ts";
import { generateUlid, nowISO } from "../lib/ulid.ts";
import { validationError, methodNotAllowed, serverError } from "../lib/errors.ts";

export async function handleStools(req: Request): Promise<Response> {
  if (req.method === "POST") return handlePost(req);
  if (req.method === "GET") return handleGet(req);
  return methodNotAllowed(`Method ${req.method} not allowed on /api/stools`);
}

async function handlePost(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body", { _form: "Request body must be valid JSON" });
  }

  const result = validateStool(body);
  if (!result.valid) {
    return validationError("Validation failed", result.fields);
  }

  const { data } = result;
  const id = generateUlid();
  const logged_at = nowISO();

  try {
    await insertStool({
      id,
      logged_at,
      bristol_type: data.bristol_type,
      frequency: data.frequency,
      urgency: data.urgency,
      pain_score: data.pain_score,
      blood: data.blood,
      notes: data.notes,
    });
  } catch (err) {
    console.error("Failed to insert stool:", err);
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
    const rows = await getStools(since ? { since } : undefined);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to get stools:", err);
    return serverError();
  }
}
