import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateMeal,
  validateStool,
  validateContext,
  validateSymptom,
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateRequiredInt,
  validateOptionalInt,
  validateOptionalNumber,
  validateOptionalBool,
  validateFodmapFlags,
  trimOrNull,
  toNumberOrNull,
} from "../../lib/validate.ts";

// --- Helper field validators ---

Deno.test("trimOrNull - returns trimmed string", () => {
  assertEquals(trimOrNull("  hello  "), "hello");
});

Deno.test("trimOrNull - returns null for empty/whitespace", () => {
  assertEquals(trimOrNull(""), null);
  assertEquals(trimOrNull("   "), null);
  assertEquals(trimOrNull(null), null);
  assertEquals(trimOrNull(undefined), null);
});

Deno.test("toNumberOrNull - coerces numeric strings", () => {
  assertEquals(toNumberOrNull("42"), 42);
  assertEquals(toNumberOrNull("3.14"), 3.14);
  assertEquals(toNumberOrNull(7), 7);
});

Deno.test("toNumberOrNull - returns null for non-numeric", () => {
  assertEquals(toNumberOrNull("abc"), null);
  assertEquals(toNumberOrNull(""), null);
  assertEquals(toNumberOrNull(null), null);
});

Deno.test("validateRequiredString - accepts valid string", () => {
  const r = validateRequiredString("hello", 500);
  assertEquals(r, { ok: true, value: "hello" });
});

Deno.test("validateRequiredString - trims input", () => {
  const r = validateRequiredString("  hi  ", 500);
  assertEquals(r, { ok: true, value: "hi" });
});

Deno.test("validateRequiredString - rejects empty", () => {
  assertEquals(validateRequiredString("", 500).ok, false);
  assertEquals(validateRequiredString("   ", 500).ok, false);
  assertEquals(validateRequiredString(null, 500).ok, false);
});

Deno.test("validateRequiredString - rejects over max length", () => {
  const long = "a".repeat(501);
  const r = validateRequiredString(long, 500);
  assertEquals(r.ok, false);
});

Deno.test("validateOptionalString - returns null for empty", () => {
  assertEquals(validateOptionalString("", 1000), { ok: true, value: null });
  assertEquals(validateOptionalString(null, 1000), { ok: true, value: null });
});

Deno.test("validateOptionalString - rejects over max", () => {
  const long = "x".repeat(1001);
  const r = validateOptionalString(long, 1000);
  assertEquals(r.ok, false);
});

Deno.test("validateEnum - accepts valid value", () => {
  const r = validateEnum("breakfast", ["breakfast", "lunch"], "type");
  assertEquals(r, { ok: true, value: "breakfast" });
});

Deno.test("validateEnum - returns null for empty", () => {
  assertEquals(validateEnum("", ["a"], "x"), { ok: true, value: null });
  assertEquals(validateEnum(null, ["a"], "x"), { ok: true, value: null });
});

Deno.test("validateEnum - rejects invalid value", () => {
  const r = validateEnum("brunch", ["breakfast", "lunch"], "type");
  assertEquals(r.ok, false);
});

Deno.test("validateRequiredInt - accepts valid", () => {
  assertEquals(validateRequiredInt(3, 1, 7, "x"), { ok: true, value: 3 });
  assertEquals(validateRequiredInt("5", 1, 7, "x"), { ok: true, value: 5 });
});

Deno.test("validateRequiredInt - rejects missing", () => {
  assertEquals(validateRequiredInt(null, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt("", 1, 7, "x").ok, false);
});

Deno.test("validateRequiredInt - rejects out of range", () => {
  assertEquals(validateRequiredInt(0, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt(8, 1, 7, "x").ok, false);
});

Deno.test("validateRequiredInt - rejects non-integer", () => {
  assertEquals(validateRequiredInt(3.5, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt("abc", 1, 7, "x").ok, false);
});

Deno.test("validateOptionalInt - returns null when absent", () => {
  assertEquals(validateOptionalInt(null, 0, 10, "x"), { ok: true, value: null });
  assertEquals(validateOptionalInt("", 0, 10, "x"), { ok: true, value: null });
});

Deno.test("validateOptionalInt - validates when present", () => {
  assertEquals(validateOptionalInt(5, 0, 10, "x"), { ok: true, value: 5 });
  assertEquals(validateOptionalInt(11, 0, 10, "x").ok, false);
});

Deno.test("validateOptionalNumber - accepts decimals", () => {
  assertEquals(validateOptionalNumber(7.5, 0, 24, "x"), { ok: true, value: 7.5 });
});

Deno.test("validateOptionalNumber - rejects out of range", () => {
  assertEquals(validateOptionalNumber(25, 0, 24, "x").ok, false);
  assertEquals(validateOptionalNumber(-1, 0, 24, "x").ok, false);
});

Deno.test("validateOptionalBool - accepts valid values", () => {
  assertEquals(validateOptionalBool(0), { ok: true, value: 0 });
  assertEquals(validateOptionalBool(1), { ok: true, value: 1 });
  assertEquals(validateOptionalBool("0"), { ok: true, value: 0 });
  assertEquals(validateOptionalBool("1"), { ok: true, value: 1 });
  assertEquals(validateOptionalBool(true), { ok: true, value: 1 });
  assertEquals(validateOptionalBool(false), { ok: true, value: 0 });
  assertEquals(validateOptionalBool(null), { ok: true, value: null });
});

Deno.test("validateOptionalBool - rejects invalid", () => {
  assertEquals(validateOptionalBool(2).ok, false);
  assertEquals(validateOptionalBool("yes").ok, false);
});

Deno.test("validateFodmapFlags - accepts valid string", () => {
  assertEquals(validateFodmapFlags("FOP"), { ok: true, value: "FOP" });
  assertEquals(validateFodmapFlags(""), { ok: true, value: "" });
  assertEquals(validateFodmapFlags(null), { ok: true, value: "" });
});

Deno.test("validateFodmapFlags - accepts array form", () => {
  assertEquals(validateFodmapFlags(["F", "O", "D"]), { ok: true, value: "FOD" });
});

Deno.test("validateFodmapFlags - rejects invalid chars", () => {
  assertEquals(validateFodmapFlags("FXO").ok, false);
});

Deno.test("validateFodmapFlags - rejects duplicates", () => {
  assertEquals(validateFodmapFlags("FOF").ok, false);
});

// --- Composite: validateMeal ---

Deno.test("validateMeal - accepts valid minimal meal", () => {
  const r = validateMeal({ description: "Pasta with sauce" });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.description, "Pasta with sauce");
    assertEquals(r.data.meal_type, null);
    assertEquals(r.data.fodmap_flags, "");
    assertEquals(r.data.portion_size, null);
    assertEquals(r.data.eating_speed, null);
  }
});

Deno.test("validateMeal - accepts full valid meal", () => {
  const r = validateMeal({
    description: "Big breakfast",
    meal_type: "breakfast",
    fodmap_flags: "FO",
    portion_size: "large",
    eating_speed: "fast",
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.meal_type, "breakfast");
    assertEquals(r.data.fodmap_flags, "FO");
    assertEquals(r.data.portion_size, "large");
    assertEquals(r.data.eating_speed, "fast");
  }
});

Deno.test("validateMeal - rejects missing description", () => {
  const r = validateMeal({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("description" in r.fields, true);
});

Deno.test("validateMeal - rejects description over 500 chars", () => {
  const r = validateMeal({ description: "x".repeat(501) });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("description" in r.fields, true);
});

Deno.test("validateMeal - rejects invalid meal_type", () => {
  const r = validateMeal({ description: "food", meal_type: "brunch" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("meal_type" in r.fields, true);
});

Deno.test("validateMeal - trims description", () => {
  const r = validateMeal({ description: "  trimmed  " });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.description, "trimmed");
});

// --- Composite: validateStool ---

Deno.test("validateStool - accepts valid minimal stool", () => {
  const r = validateStool({ bristol_type: 4 });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.bristol_type, 4);
    assertEquals(r.data.frequency, null);
    assertEquals(r.data.urgency, null);
    assertEquals(r.data.pain_score, null);
    assertEquals(r.data.blood, null);
    assertEquals(r.data.notes, null);
  }
});

Deno.test("validateStool - accepts full valid stool", () => {
  const r = validateStool({
    bristol_type: 6,
    frequency: 3,
    urgency: 1,
    pain_score: 7,
    blood: 0,
    notes: "Rough morning",
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.bristol_type, 6);
    assertEquals(r.data.frequency, 3);
    assertEquals(r.data.urgency, 1);
    assertEquals(r.data.pain_score, 7);
    assertEquals(r.data.blood, 0);
    assertEquals(r.data.notes, "Rough morning");
  }
});

Deno.test("validateStool - rejects missing bristol_type", () => {
  const r = validateStool({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("bristol_type" in r.fields, true);
});

Deno.test("validateStool - rejects bristol_type out of range", () => {
  assertEquals(validateStool({ bristol_type: 0 }).valid, false);
  assertEquals(validateStool({ bristol_type: 8 }).valid, false);
});

Deno.test("validateStool - coerces string bristol_type", () => {
  const r = validateStool({ bristol_type: "4" });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.bristol_type, 4);
});

// --- Composite: validateContext ---

Deno.test("validateContext - accepts valid context", () => {
  const r = validateContext({ stress_score: 5, sleep_hours: 7.5 });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.stress_score, 5);
    assertEquals(r.data.sleep_hours, 7.5);
  }
});

Deno.test("validateContext - rejects empty body (no fields)", () => {
  const r = validateContext({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("_form" in r.fields, true);
});

Deno.test("validateContext - rejects stress out of range", () => {
  const r = validateContext({ stress_score: 11 });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("stress_score" in r.fields, true);
});

Deno.test("validateContext - rejects invalid exercise_type", () => {
  const r = validateContext({ exercise_type: "swimming" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("exercise_type" in r.fields, true);
});

Deno.test("validateContext - accepts all valid enums", () => {
  const r = validateContext({
    exercise_type: "gym",
    menstrual_phase: "luteal",
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.exercise_type, "gym");
    assertEquals(r.data.menstrual_phase, "luteal");
  }
});

Deno.test("validateContext - accepts boundary values", () => {
  const r = validateContext({
    stress_score: 1,
    sleep_hours: 0,
    sleep_quality: 5,
    water_litres: 20,
    exercise_duration: 1440,
    caffeine_mg: 2000,
    alcohol_units: 50,
  });
  assertEquals(r.valid, true);
});

// --- Composite: validateSymptom ---

Deno.test("validateSymptom - accepts valid symptoms", () => {
  const r = validateSymptom({
    bloating: 3,
    cramping: 5,
    nausea: 0,
    urgency: 10,
    fatigue: 7,
    overall: 6,
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.bloating, 3);
    assertEquals(r.data.cramping, 5);
    assertEquals(r.data.nausea, 0);
    assertEquals(r.data.urgency, 10);
    assertEquals(r.data.fatigue, 7);
    assertEquals(r.data.overall, 6);
    assertEquals(r.data.notes, null);
  }
});

Deno.test("validateSymptom - accepts with notes", () => {
  const r = validateSymptom({
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
    notes: "Feeling great",
  });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.notes, "Feeling great");
});

Deno.test("validateSymptom - rejects missing fields", () => {
  const r = validateSymptom({ bloating: 5 });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("cramping" in r.fields, true);
    assertEquals("nausea" in r.fields, true);
    assertEquals("urgency" in r.fields, true);
    assertEquals("fatigue" in r.fields, true);
    assertEquals("overall" in r.fields, true);
  }
});

Deno.test("validateSymptom - rejects out of range", () => {
  const r = validateSymptom({
    bloating: 11,
    cramping: -1,
    nausea: 5,
    urgency: 5,
    fatigue: 5,
    overall: 5,
  });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("bloating" in r.fields, true);
    assertEquals("cramping" in r.fields, true);
  }
});

Deno.test("validateSymptom - coerces string numbers", () => {
  const r = validateSymptom({
    bloating: "3",
    cramping: "5",
    nausea: "0",
    urgency: "10",
    fatigue: "7",
    overall: "6",
  });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.bloating, 3);
});
