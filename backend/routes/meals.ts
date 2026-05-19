import { createErrorResponse } from "../lib/errors.ts";
import { generateUlid, generateTimestamp } from "../lib/ulid.ts";
import {
  validateString,
  validateEnum,
  validateFodmapFlags,
  validateIngredients,
  validateBoolean,
  hasErrors,
  type ValidationErrors,
} from "../lib/validate.ts";
import { insertMealLog, type MealLogRow } from "../db/queries.ts";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const PORTION_SIZES = ["small", "medium", "large"] as const;
const EATING_SPEEDS = ["slow", "normal", "fast"] as const;

export async function handleMeals(req: Request): Promise<Response> {
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

  const description = validateString(data.description, "description", 1, 500, errors, true);
  const meal_type = validateEnum(data.meal_type, "meal_type", MEAL_TYPES, errors);
  const fodmap_flags = validateFodmapFlags(data.fodmap_flags, "fodmap_flags", errors);
  const ingredients = validateIngredients(data.ingredients, "ingredients", errors);
  const portion_size = validateEnum(data.portion_size, "portion_size", PORTION_SIZES, errors);
  const eating_speed = validateEnum(data.eating_speed, "eating_speed", EATING_SPEEDS, errors);
  const scan_used = validateBoolean(data.scan_used, "scan_used", errors);

  // Validate fodmap_detail if provided
  let fodmap_detail: Record<string, string[]> = {};
  if (data.fodmap_detail !== undefined && data.fodmap_detail !== null) {
    if (typeof data.fodmap_detail !== "object" || Array.isArray(data.fodmap_detail)) {
      errors["fodmap_detail"] = "fodmap_detail must be an object";
    } else {
      fodmap_detail = data.fodmap_detail as Record<string, string[]>;
    }
  }

  if (hasErrors(errors)) {
    return createErrorResponse("VALIDATION_ERROR", "Validation failed", 400, errors);
  }

  const row: MealLogRow = {
    id: generateUlid(),
    logged_at: generateTimestamp(),
    meal_type: meal_type ?? null,
    description: description!,
    fodmap_flags: JSON.stringify(fodmap_flags ?? []),
    ingredients: JSON.stringify(ingredients ?? []),
    fodmap_detail: JSON.stringify(fodmap_detail),
    portion_size: portion_size ?? null,
    eating_speed: eating_speed ?? null,
    scan_used: scan_used ?? 0,
  };

  try {
    await insertMealLog(row);
  } catch {
    return createErrorResponse("STORAGE_ERROR", "Failed to store meal log", 500);
  }

  const response = {
    id: row.id,
    logged_at: row.logged_at,
    meal_type: row.meal_type,
    description: row.description,
    fodmap_flags: JSON.parse(row.fodmap_flags),
    ingredients: JSON.parse(row.ingredients),
    fodmap_detail: JSON.parse(row.fodmap_detail),
    portion_size: row.portion_size,
    eating_speed: row.eating_speed,
    scan_used: row.scan_used,
  };

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
