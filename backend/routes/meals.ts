/**
 * Meal log route handler.
 * POST /api/meals — create a meal log entry.
 * GET  /api/meals — retrieve meal logs (optional ?since= filter).
 */

import { validateMeal } from "../lib/validate.ts";
import { insertMeal, getMeals } from "../db/queries.ts";
import { generateUlid, nowISO } from "../lib/ulid.ts";
import { validationError, methodNotAllowed, serverError } from "../lib/errors.ts";

export async function handleMeals(req: Request): Promise<Response> {
  if (req.method === "POST") return handlePost(req);
  if (req.method === "GET") return handleGet(req);
  return methodNotAllowed(`Method ${req.method} not allowed on /api/meals`);
}

async function handlePost(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body", { _form: "Request body must be valid JSON" });
  }

  const result = validateMeal(body);
  if (!result.valid) {
    return validationError("Validation failed", result.fields);
  }

  const { data } = result;
  const id = generateUlid();
  const logged_at = nowISO();

  try {
    await insertMeal({
      id,
      logged_at,
      meal_type: data.meal_type,
      description: data.description,
      fodmap_flags: data.fodmap_flags ? JSON.stringify(data.fodmap_flags.split("")) : "[]",
      portion_size: data.portion_size,
      eating_speed: data.eating_speed,
      scan_used: 0,
    });
  } catch (err) {
    console.error("Failed to insert meal:", err);
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
    const rows = await getMeals(since ? { since } : undefined);
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to get meals:", err);
    return serverError();
  }
}
