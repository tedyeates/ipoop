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

// ============================================================
// trimOrNull
// ============================================================

Deno.test("trimOrNull - returns trimmed string", () => {
  assertEquals(trimOrNull("  hello  "), "hello");
});

Deno.test("trimOrNull - returns null for empty/whitespace/null/undefined", () => {
  assertEquals(trimOrNull(""), null);
  assertEquals(trimOrNull("   "), null);
  assertEquals(trimOrNull("\t\n"), null);
  assertEquals(trimOrNull(null), null);
  assertEquals(trimOrNull(undefined), null);
});

Deno.test("trimOrNull - single char preserved", () => {
  assertEquals(trimOrNull("x"), "x");
});

// ============================================================
// toNumberOrNull
// ============================================================

Deno.test("toNumberOrNull - coerces numeric strings", () => {
  assertEquals(toNumberOrNull("42"), 42);
  assertEquals(toNumberOrNull("3.14"), 3.14);
  assertEquals(toNumberOrNull("0"), 0);
  assertEquals(toNumberOrNull(7), 7);
});

Deno.test("toNumberOrNull - returns null for non-numeric", () => {
  assertEquals(toNumberOrNull("abc"), null);
  assertEquals(toNumberOrNull(""), null);
  assertEquals(toNumberOrNull(null), null);
  assertEquals(toNumberOrNull(undefined), null);
});

// ============================================================
// validateRequiredString — boundary: empty, 1 char, max, max+1, whitespace
// ============================================================

Deno.test("validateRequiredString - accepts 1 char", () => {
  assertEquals(validateRequiredString("x", 500), { ok: true, value: "x" });
});

Deno.test("validateRequiredString - accepts exactly max length", () => {
  const s = "a".repeat(500);
  assertEquals(validateRequiredString(s, 500), { ok: true, value: s });
});

Deno.test("validateRequiredString - rejects max+1 length", () => {
  const s = "a".repeat(501);
  const r = validateRequiredString(s, 500);
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error, "Must be 500 characters or less");
});

Deno.test("validateRequiredString - rejects empty string", () => {
  const r = validateRequiredString("", 500);
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error, "Required");
});

Deno.test("validateRequiredString - rejects whitespace-only", () => {
  const r = validateRequiredString("   ", 500);
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error, "Required");
});

Deno.test("validateRequiredString - rejects null/undefined", () => {
  assertEquals(validateRequiredString(null, 500).ok, false);
  assertEquals(validateRequiredString(undefined, 500).ok, false);
});

Deno.test("validateRequiredString - trims before length check", () => {
  // 500 chars + surrounding spaces should pass (trimmed = 500)
  const s = "  " + "b".repeat(500) + "  ";
  assertEquals(validateRequiredString(s, 500), { ok: true, value: "b".repeat(500) });
});

// ============================================================
// validateOptionalString — boundary: empty, 1 char, max, max+1, whitespace
// ============================================================

Deno.test("validateOptionalString - returns null for empty", () => {
  assertEquals(validateOptionalString("", 1000), { ok: true, value: null });
});

Deno.test("validateOptionalString - returns null for null/undefined", () => {
  assertEquals(validateOptionalString(null, 1000), { ok: true, value: null });
  assertEquals(validateOptionalString(undefined, 1000), { ok: true, value: null });
});

Deno.test("validateOptionalString - returns null for whitespace-only", () => {
  assertEquals(validateOptionalString("   ", 1000), { ok: true, value: null });
});

Deno.test("validateOptionalString - accepts 1 char", () => {
  assertEquals(validateOptionalString("x", 1000), { ok: true, value: "x" });
});

Deno.test("validateOptionalString - accepts exactly max length", () => {
  const s = "z".repeat(1000);
  assertEquals(validateOptionalString(s, 1000), { ok: true, value: s });
});

Deno.test("validateOptionalString - rejects max+1 length", () => {
  const s = "z".repeat(1001);
  const r = validateOptionalString(s, 1000);
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error, "Must be 1000 characters or less");
});

Deno.test("validateOptionalString - trims before length check", () => {
  const s = "  " + "c".repeat(1000) + "  ";
  assertEquals(validateOptionalString(s, 1000), { ok: true, value: "c".repeat(1000) });
});

// ============================================================
// validateEnum — every valid value + invalid
// ============================================================

Deno.test("validateEnum - accepts every valid meal_type", () => {
  for (const v of ["breakfast", "lunch", "dinner", "snack"]) {
    const r = validateEnum(v, ["breakfast", "lunch", "dinner", "snack"], "meal type");
    assertEquals(r, { ok: true, value: v });
  }
});

Deno.test("validateEnum - returns null for empty/null/undefined", () => {
  const allowed = ["a", "b"];
  assertEquals(validateEnum("", allowed, "x"), { ok: true, value: null });
  assertEquals(validateEnum(null, allowed, "x"), { ok: true, value: null });
  assertEquals(validateEnum(undefined, allowed, "x"), { ok: true, value: null });
  assertEquals(validateEnum("   ", allowed, "x"), { ok: true, value: null });
});

Deno.test("validateEnum - rejects invalid value", () => {
  const r = validateEnum("brunch", ["breakfast", "lunch", "dinner", "snack"], "meal type");
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error, "Invalid meal type");
});

Deno.test("validateEnum - case sensitive", () => {
  const r = validateEnum("Breakfast", ["breakfast", "lunch"], "meal type");
  assertEquals(r.ok, false);
});

Deno.test("validateEnum - accepts every valid portion_size", () => {
  for (const v of ["small", "medium", "large"]) {
    assertEquals(validateEnum(v, ["small", "medium", "large"], "portion size"), { ok: true, value: v });
  }
});

Deno.test("validateEnum - accepts every valid eating_speed", () => {
  for (const v of ["slow", "normal", "fast"]) {
    assertEquals(validateEnum(v, ["slow", "normal", "fast"], "eating speed"), { ok: true, value: v });
  }
});

Deno.test("validateEnum - accepts every valid exercise_type", () => {
  for (const v of ["none", "walk", "gym", "run", "other"]) {
    assertEquals(validateEnum(v, ["none", "walk", "gym", "run", "other"], "exercise type"), { ok: true, value: v });
  }
});

Deno.test("validateEnum - accepts every valid menstrual_phase", () => {
  for (const v of ["follicular", "ovulatory", "luteal", "menstrual", "n/a"]) {
    assertEquals(validateEnum(v, ["follicular", "ovulatory", "luteal", "menstrual", "n/a"], "menstrual phase"), { ok: true, value: v });
  }
});

// ============================================================
// validateRequiredInt — boundary: min, max, min-1, max+1
// ============================================================

Deno.test("validateRequiredInt - accepts min boundary (1 for 1-7)", () => {
  assertEquals(validateRequiredInt(1, 1, 7, "Bristol type"), { ok: true, value: 1 });
});

Deno.test("validateRequiredInt - accepts max boundary (7 for 1-7)", () => {
  assertEquals(validateRequiredInt(7, 1, 7, "Bristol type"), { ok: true, value: 7 });
});

Deno.test("validateRequiredInt - rejects min-1 (0 for 1-7)", () => {
  const r = validateRequiredInt(0, 1, 7, "Bristol type");
  assertEquals(r.ok, false);
});

Deno.test("validateRequiredInt - rejects max+1 (8 for 1-7)", () => {
  const r = validateRequiredInt(8, 1, 7, "Bristol type");
  assertEquals(r.ok, false);
});

Deno.test("validateRequiredInt - accepts 0-10 boundaries", () => {
  assertEquals(validateRequiredInt(0, 0, 10, "severity"), { ok: true, value: 0 });
  assertEquals(validateRequiredInt(10, 0, 10, "severity"), { ok: true, value: 10 });
});

Deno.test("validateRequiredInt - rejects -1 and 11 for 0-10", () => {
  assertEquals(validateRequiredInt(-1, 0, 10, "severity").ok, false);
  assertEquals(validateRequiredInt(11, 0, 10, "severity").ok, false);
});

Deno.test("validateRequiredInt - rejects missing (null/empty)", () => {
  assertEquals(validateRequiredInt(null, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt("", 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt(undefined, 1, 7, "x").ok, false);
});

Deno.test("validateRequiredInt - rejects non-integer (float)", () => {
  assertEquals(validateRequiredInt(3.5, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt(1.1, 1, 7, "x").ok, false);
});

Deno.test("validateRequiredInt - rejects NaN/Infinity", () => {
  assertEquals(validateRequiredInt(NaN, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt(Infinity, 1, 7, "x").ok, false);
  assertEquals(validateRequiredInt("abc", 1, 7, "x").ok, false);
});

Deno.test("validateRequiredInt - coerces string numbers", () => {
  assertEquals(validateRequiredInt("5", 1, 7, "x"), { ok: true, value: 5 });
  assertEquals(validateRequiredInt("1", 1, 7, "x"), { ok: true, value: 1 });
  assertEquals(validateRequiredInt("7", 1, 7, "x"), { ok: true, value: 7 });
});

// ============================================================
// validateOptionalInt — boundary: min, max, min-1, max+1
// ============================================================

Deno.test("validateOptionalInt - returns null when absent", () => {
  assertEquals(validateOptionalInt(null, 0, 10, "x"), { ok: true, value: null });
  assertEquals(validateOptionalInt("", 0, 10, "x"), { ok: true, value: null });
  assertEquals(validateOptionalInt(undefined, 0, 10, "x"), { ok: true, value: null });
});

Deno.test("validateOptionalInt - accepts min boundary (0 for 0-10)", () => {
  assertEquals(validateOptionalInt(0, 0, 10, "Pain score"), { ok: true, value: 0 });
});

Deno.test("validateOptionalInt - accepts max boundary (10 for 0-10)", () => {
  assertEquals(validateOptionalInt(10, 0, 10, "Pain score"), { ok: true, value: 10 });
});

Deno.test("validateOptionalInt - rejects min-1 (-1 for 0-10)", () => {
  assertEquals(validateOptionalInt(-1, 0, 10, "Pain score").ok, false);
});

Deno.test("validateOptionalInt - rejects max+1 (11 for 0-10)", () => {
  assertEquals(validateOptionalInt(11, 0, 10, "Pain score").ok, false);
});

Deno.test("validateOptionalInt - accepts 1-20 boundaries (frequency)", () => {
  assertEquals(validateOptionalInt(1, 1, 20, "Frequency"), { ok: true, value: 1 });
  assertEquals(validateOptionalInt(20, 1, 20, "Frequency"), { ok: true, value: 20 });
});

Deno.test("validateOptionalInt - rejects 0 and 21 for 1-20", () => {
  assertEquals(validateOptionalInt(0, 1, 20, "Frequency").ok, false);
  assertEquals(validateOptionalInt(21, 1, 20, "Frequency").ok, false);
});

Deno.test("validateOptionalInt - accepts 1-5 boundaries (sleep quality)", () => {
  assertEquals(validateOptionalInt(1, 1, 5, "Sleep quality"), { ok: true, value: 1 });
  assertEquals(validateOptionalInt(5, 1, 5, "Sleep quality"), { ok: true, value: 5 });
});

Deno.test("validateOptionalInt - rejects 0 and 6 for 1-5", () => {
  assertEquals(validateOptionalInt(0, 1, 5, "Sleep quality").ok, false);
  assertEquals(validateOptionalInt(6, 1, 5, "Sleep quality").ok, false);
});

Deno.test("validateOptionalInt - accepts 0-1440 boundaries (exercise duration)", () => {
  assertEquals(validateOptionalInt(0, 0, 1440, "Exercise duration"), { ok: true, value: 0 });
  assertEquals(validateOptionalInt(1440, 0, 1440, "Exercise duration"), { ok: true, value: 1440 });
});

Deno.test("validateOptionalInt - rejects -1 and 1441 for 0-1440", () => {
  assertEquals(validateOptionalInt(-1, 0, 1440, "Exercise duration").ok, false);
  assertEquals(validateOptionalInt(1441, 0, 1440, "Exercise duration").ok, false);
});

Deno.test("validateOptionalInt - accepts 0-2000 boundaries (caffeine)", () => {
  assertEquals(validateOptionalInt(0, 0, 2000, "Caffeine"), { ok: true, value: 0 });
  assertEquals(validateOptionalInt(2000, 0, 2000, "Caffeine"), { ok: true, value: 2000 });
});

Deno.test("validateOptionalInt - rejects -1 and 2001 for 0-2000", () => {
  assertEquals(validateOptionalInt(-1, 0, 2000, "Caffeine").ok, false);
  assertEquals(validateOptionalInt(2001, 0, 2000, "Caffeine").ok, false);
});

Deno.test("validateOptionalInt - rejects non-integer", () => {
  assertEquals(validateOptionalInt(3.5, 0, 10, "x").ok, false);
  assertEquals(validateOptionalInt("abc", 0, 10, "x").ok, false);
});

// ============================================================
// validateOptionalNumber — boundary: min, max, min-1, max+1
// ============================================================

Deno.test("validateOptionalNumber - returns null when absent", () => {
  assertEquals(validateOptionalNumber(null, 0, 24, "x"), { ok: true, value: null });
  assertEquals(validateOptionalNumber("", 0, 24, "x"), { ok: true, value: null });
  assertEquals(validateOptionalNumber(undefined, 0, 24, "x"), { ok: true, value: null });
});

Deno.test("validateOptionalNumber - accepts min boundary (0 for 0-24)", () => {
  assertEquals(validateOptionalNumber(0, 0, 24, "Sleep hours"), { ok: true, value: 0 });
});

Deno.test("validateOptionalNumber - accepts max boundary (24 for 0-24)", () => {
  assertEquals(validateOptionalNumber(24, 0, 24, "Sleep hours"), { ok: true, value: 24 });
});

Deno.test("validateOptionalNumber - rejects below min (-0.1 for 0-24)", () => {
  assertEquals(validateOptionalNumber(-0.1, 0, 24, "Sleep hours").ok, false);
});

Deno.test("validateOptionalNumber - rejects above max (24.1 for 0-24)", () => {
  assertEquals(validateOptionalNumber(24.1, 0, 24, "Sleep hours").ok, false);
});

Deno.test("validateOptionalNumber - accepts decimals within range", () => {
  assertEquals(validateOptionalNumber(7.5, 0, 24, "Sleep hours"), { ok: true, value: 7.5 });
  assertEquals(validateOptionalNumber(1.5, 0, 20, "Water"), { ok: true, value: 1.5 });
});

Deno.test("validateOptionalNumber - accepts 0-20 boundaries (water)", () => {
  assertEquals(validateOptionalNumber(0, 0, 20, "Water"), { ok: true, value: 0 });
  assertEquals(validateOptionalNumber(20, 0, 20, "Water"), { ok: true, value: 20 });
});

Deno.test("validateOptionalNumber - rejects -0.1 and 20.1 for 0-20", () => {
  assertEquals(validateOptionalNumber(-0.1, 0, 20, "Water").ok, false);
  assertEquals(validateOptionalNumber(20.1, 0, 20, "Water").ok, false);
});

Deno.test("validateOptionalNumber - accepts 0-50 boundaries (alcohol)", () => {
  assertEquals(validateOptionalNumber(0, 0, 50, "Alcohol"), { ok: true, value: 0 });
  assertEquals(validateOptionalNumber(50, 0, 50, "Alcohol"), { ok: true, value: 50 });
});

Deno.test("validateOptionalNumber - rejects -0.1 and 50.1 for 0-50", () => {
  assertEquals(validateOptionalNumber(-0.1, 0, 50, "Alcohol").ok, false);
  assertEquals(validateOptionalNumber(50.1, 0, 50, "Alcohol").ok, false);
});

Deno.test("validateOptionalNumber - rejects NaN/Infinity", () => {
  assertEquals(validateOptionalNumber(NaN, 0, 24, "x").ok, false);
  assertEquals(validateOptionalNumber(Infinity, 0, 24, "x").ok, false);
  assertEquals(validateOptionalNumber("abc", 0, 24, "x").ok, false);
});

// ============================================================
// validateOptionalBool
// ============================================================

Deno.test("validateOptionalBool - accepts all valid truthy/falsy values", () => {
  assertEquals(validateOptionalBool(0), { ok: true, value: 0 });
  assertEquals(validateOptionalBool(1), { ok: true, value: 1 });
  assertEquals(validateOptionalBool("0"), { ok: true, value: 0 });
  assertEquals(validateOptionalBool("1"), { ok: true, value: 1 });
  assertEquals(validateOptionalBool(true), { ok: true, value: 1 });
  assertEquals(validateOptionalBool(false), { ok: true, value: 0 });
});

Deno.test("validateOptionalBool - returns null when absent", () => {
  assertEquals(validateOptionalBool(null), { ok: true, value: null });
  assertEquals(validateOptionalBool(undefined), { ok: true, value: null });
  assertEquals(validateOptionalBool(""), { ok: true, value: null });
});

Deno.test("validateOptionalBool - rejects invalid values", () => {
  assertEquals(validateOptionalBool(2).ok, false);
  assertEquals(validateOptionalBool(-1).ok, false);
  assertEquals(validateOptionalBool("yes").ok, false);
  assertEquals(validateOptionalBool("true").ok, false);
  assertEquals(validateOptionalBool("no").ok, false);
});

// ============================================================
// validateFodmapFlags — all valid subsets, invalid characters, duplicates
// ============================================================

Deno.test("validateFodmapFlags - accepts empty/null", () => {
  assertEquals(validateFodmapFlags(""), { ok: true, value: "" });
  assertEquals(validateFodmapFlags(null), { ok: true, value: "" });
  assertEquals(validateFodmapFlags(undefined), { ok: true, value: "" });
});

Deno.test("validateFodmapFlags - accepts each single valid flag", () => {
  assertEquals(validateFodmapFlags("F"), { ok: true, value: "F" });
  assertEquals(validateFodmapFlags("O"), { ok: true, value: "O" });
  assertEquals(validateFodmapFlags("D"), { ok: true, value: "D" });
  assertEquals(validateFodmapFlags("M"), { ok: true, value: "M" });
  assertEquals(validateFodmapFlags("P"), { ok: true, value: "P" });
});

Deno.test("validateFodmapFlags - accepts all valid pairs", () => {
  assertEquals(validateFodmapFlags("FO"), { ok: true, value: "FO" });
  assertEquals(validateFodmapFlags("FD"), { ok: true, value: "FD" });
  assertEquals(validateFodmapFlags("FM"), { ok: true, value: "FM" });
  assertEquals(validateFodmapFlags("FP"), { ok: true, value: "FP" });
  assertEquals(validateFodmapFlags("OD"), { ok: true, value: "OD" });
  assertEquals(validateFodmapFlags("OM"), { ok: true, value: "OM" });
  assertEquals(validateFodmapFlags("OP"), { ok: true, value: "OP" });
  assertEquals(validateFodmapFlags("DM"), { ok: true, value: "DM" });
  assertEquals(validateFodmapFlags("DP"), { ok: true, value: "DP" });
  assertEquals(validateFodmapFlags("MP"), { ok: true, value: "MP" });
});

Deno.test("validateFodmapFlags - accepts full set FODMP", () => {
  assertEquals(validateFodmapFlags("FODMP"), { ok: true, value: "FODMP" });
});

Deno.test("validateFodmapFlags - case insensitive (lowercased input)", () => {
  assertEquals(validateFodmapFlags("fod"), { ok: true, value: "FOD" });
  assertEquals(validateFodmapFlags("fodmp"), { ok: true, value: "FODMP" });
});

Deno.test("validateFodmapFlags - accepts array form", () => {
  assertEquals(validateFodmapFlags(["F", "O", "D"]), { ok: true, value: "FOD" });
  assertEquals(validateFodmapFlags(["m", "p"]), { ok: true, value: "MP" });
});

Deno.test("validateFodmapFlags - rejects invalid characters", () => {
  assertEquals(validateFodmapFlags("X").ok, false);
  assertEquals(validateFodmapFlags("FXO").ok, false);
  assertEquals(validateFodmapFlags("A").ok, false);
  assertEquals(validateFodmapFlags("FOZ").ok, false);
  assertEquals(validateFodmapFlags("1").ok, false);
});

Deno.test("validateFodmapFlags - rejects duplicates", () => {
  assertEquals(validateFodmapFlags("FF").ok, false);
  assertEquals(validateFodmapFlags("FOF").ok, false);
  assertEquals(validateFodmapFlags("FOMMP").ok, false);
});

Deno.test("validateFodmapFlags - rejects duplicate in array form", () => {
  assertEquals(validateFodmapFlags(["F", "F"]).ok, false);
  assertEquals(validateFodmapFlags(["O", "D", "O"]).ok, false);
});

// ============================================================
// validateMeal — composite validator
// ============================================================

Deno.test("validateMeal - accepts minimal valid (description only)", () => {
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

Deno.test("validateMeal - accepts full valid meal with all fields", () => {
  const r = validateMeal({
    description: "Big breakfast",
    meal_type: "breakfast",
    fodmap_flags: "FODMP",
    portion_size: "large",
    eating_speed: "fast",
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.description, "Big breakfast");
    assertEquals(r.data.meal_type, "breakfast");
    assertEquals(r.data.fodmap_flags, "FODMP");
    assertEquals(r.data.portion_size, "large");
    assertEquals(r.data.eating_speed, "fast");
  }
});

Deno.test("validateMeal - accepts description at exactly 500 chars", () => {
  const r = validateMeal({ description: "a".repeat(500) });
  assertEquals(r.valid, true);
});

Deno.test("validateMeal - rejects description at 501 chars", () => {
  const r = validateMeal({ description: "a".repeat(501) });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("description" in r.fields, true);
});

Deno.test("validateMeal - rejects missing description", () => {
  const r = validateMeal({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("description" in r.fields, true);
});

Deno.test("validateMeal - rejects whitespace-only description", () => {
  const r = validateMeal({ description: "   " });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("description" in r.fields, true);
});

Deno.test("validateMeal - rejects invalid meal_type", () => {
  const r = validateMeal({ description: "food", meal_type: "brunch" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("meal_type" in r.fields, true);
});

Deno.test("validateMeal - rejects invalid portion_size", () => {
  const r = validateMeal({ description: "food", portion_size: "huge" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("portion_size" in r.fields, true);
});

Deno.test("validateMeal - rejects invalid eating_speed", () => {
  const r = validateMeal({ description: "food", eating_speed: "turbo" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("eating_speed" in r.fields, true);
});

Deno.test("validateMeal - rejects invalid fodmap_flags", () => {
  const r = validateMeal({ description: "food", fodmap_flags: "XYZ" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("fodmap_flags" in r.fields, true);
});

Deno.test("validateMeal - compound: multiple invalid fields at once", () => {
  const r = validateMeal({
    description: "",
    meal_type: "brunch",
    fodmap_flags: "XYZ",
    portion_size: "huge",
    eating_speed: "turbo",
  });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("description" in r.fields, true);
    assertEquals("meal_type" in r.fields, true);
    assertEquals("fodmap_flags" in r.fields, true);
    assertEquals("portion_size" in r.fields, true);
    assertEquals("eating_speed" in r.fields, true);
  }
});

Deno.test("validateMeal - trims description", () => {
  const r = validateMeal({ description: "  trimmed  " });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.description, "trimmed");
});

// ============================================================
// validateStool — composite validator with boundaries
// ============================================================

Deno.test("validateStool - accepts minimal valid (bristol_type only)", () => {
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

Deno.test("validateStool - bristol_type boundaries (1 and 7)", () => {
  assertEquals(validateStool({ bristol_type: 1 }).valid, true);
  assertEquals(validateStool({ bristol_type: 7 }).valid, true);
});

Deno.test("validateStool - bristol_type out of range (0 and 8)", () => {
  assertEquals(validateStool({ bristol_type: 0 }).valid, false);
  assertEquals(validateStool({ bristol_type: 8 }).valid, false);
});

Deno.test("validateStool - rejects missing bristol_type", () => {
  const r = validateStool({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("bristol_type" in r.fields, true);
});

Deno.test("validateStool - pain_score boundaries (0 and 10)", () => {
  assertEquals(validateStool({ bristol_type: 4, pain_score: 0 }).valid, true);
  assertEquals(validateStool({ bristol_type: 4, pain_score: 10 }).valid, true);
});

Deno.test("validateStool - pain_score out of range (-1 and 11)", () => {
  assertEquals(validateStool({ bristol_type: 4, pain_score: -1 }).valid, false);
  assertEquals(validateStool({ bristol_type: 4, pain_score: 11 }).valid, false);
});

Deno.test("validateStool - frequency boundaries (1 and 20)", () => {
  assertEquals(validateStool({ bristol_type: 4, frequency: 1 }).valid, true);
  assertEquals(validateStool({ bristol_type: 4, frequency: 20 }).valid, true);
});

Deno.test("validateStool - frequency out of range (0 and 21)", () => {
  assertEquals(validateStool({ bristol_type: 4, frequency: 0 }).valid, false);
  assertEquals(validateStool({ bristol_type: 4, frequency: 21 }).valid, false);
});

Deno.test("validateStool - notes at max 1000 chars", () => {
  const r = validateStool({ bristol_type: 4, notes: "n".repeat(1000) });
  assertEquals(r.valid, true);
});

Deno.test("validateStool - notes over 1000 chars rejected", () => {
  const r = validateStool({ bristol_type: 4, notes: "n".repeat(1001) });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("notes" in r.fields, true);
});

Deno.test("validateStool - compound: multiple invalid fields", () => {
  const r = validateStool({
    bristol_type: 0,
    frequency: 21,
    pain_score: 11,
    urgency: 2,
    blood: 2,
  });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("bristol_type" in r.fields, true);
    assertEquals("frequency" in r.fields, true);
    assertEquals("pain_score" in r.fields, true);
    assertEquals("urgency" in r.fields, true);
    assertEquals("blood" in r.fields, true);
  }
});

Deno.test("validateStool - coerces string bristol_type", () => {
  const r = validateStool({ bristol_type: "4" });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.bristol_type, 4);
});

// ============================================================
// validateContext — composite validator with boundaries
// ============================================================

Deno.test("validateContext - accepts single valid field", () => {
  const r = validateContext({ stress_score: 5 });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.stress_score, 5);
});

Deno.test("validateContext - rejects empty body (no fields)", () => {
  const r = validateContext({});
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("_form" in r.fields, true);
});

Deno.test("validateContext - rejects all-null body", () => {
  const r = validateContext({
    stress_score: null,
    sleep_hours: null,
    sleep_quality: null,
  });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("_form" in r.fields, true);
});

Deno.test("validateContext - stress_score boundaries (1 and 10)", () => {
  assertEquals(validateContext({ stress_score: 1 }).valid, true);
  assertEquals(validateContext({ stress_score: 10 }).valid, true);
});

Deno.test("validateContext - stress_score out of range (0 and 11)", () => {
  assertEquals(validateContext({ stress_score: 0 }).valid, false);
  assertEquals(validateContext({ stress_score: 11 }).valid, false);
});

Deno.test("validateContext - sleep_hours boundaries (0 and 24)", () => {
  assertEquals(validateContext({ sleep_hours: 0 }).valid, true);
  assertEquals(validateContext({ sleep_hours: 24 }).valid, true);
});

Deno.test("validateContext - sleep_hours out of range (-0.1 and 24.1)", () => {
  assertEquals(validateContext({ sleep_hours: -0.1 }).valid, false);
  assertEquals(validateContext({ sleep_hours: 24.1 }).valid, false);
});

Deno.test("validateContext - sleep_quality boundaries (1 and 5)", () => {
  assertEquals(validateContext({ sleep_quality: 1 }).valid, true);
  assertEquals(validateContext({ sleep_quality: 5 }).valid, true);
});

Deno.test("validateContext - sleep_quality out of range (0 and 6)", () => {
  assertEquals(validateContext({ sleep_quality: 0 }).valid, false);
  assertEquals(validateContext({ sleep_quality: 6 }).valid, false);
});

Deno.test("validateContext - water_litres boundaries (0 and 20)", () => {
  assertEquals(validateContext({ water_litres: 0 }).valid, true);
  assertEquals(validateContext({ water_litres: 20 }).valid, true);
});

Deno.test("validateContext - water_litres out of range", () => {
  assertEquals(validateContext({ water_litres: -0.1 }).valid, false);
  assertEquals(validateContext({ water_litres: 20.1 }).valid, false);
});

Deno.test("validateContext - exercise_duration boundaries (0 and 1440)", () => {
  assertEquals(validateContext({ exercise_duration: 0 }).valid, true);
  assertEquals(validateContext({ exercise_duration: 1440 }).valid, true);
});

Deno.test("validateContext - exercise_duration out of range", () => {
  assertEquals(validateContext({ exercise_duration: -1 }).valid, false);
  assertEquals(validateContext({ exercise_duration: 1441 }).valid, false);
});

Deno.test("validateContext - caffeine_mg boundaries (0 and 2000)", () => {
  assertEquals(validateContext({ caffeine_mg: 0 }).valid, true);
  assertEquals(validateContext({ caffeine_mg: 2000 }).valid, true);
});

Deno.test("validateContext - caffeine_mg out of range", () => {
  assertEquals(validateContext({ caffeine_mg: -1 }).valid, false);
  assertEquals(validateContext({ caffeine_mg: 2001 }).valid, false);
});

Deno.test("validateContext - alcohol_units boundaries (0 and 50)", () => {
  assertEquals(validateContext({ alcohol_units: 0 }).valid, true);
  assertEquals(validateContext({ alcohol_units: 50 }).valid, true);
});

Deno.test("validateContext - alcohol_units out of range", () => {
  assertEquals(validateContext({ alcohol_units: -0.1 }).valid, false);
  assertEquals(validateContext({ alcohol_units: 50.1 }).valid, false);
});

Deno.test("validateContext - accepts all valid exercise_types", () => {
  for (const v of ["none", "walk", "gym", "run", "other"]) {
    const r = validateContext({ exercise_type: v });
    assertEquals(r.valid, true, `exercise_type '${v}' should be valid`);
  }
});

Deno.test("validateContext - rejects invalid exercise_type", () => {
  const r = validateContext({ exercise_type: "swimming" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("exercise_type" in r.fields, true);
});

Deno.test("validateContext - accepts all valid menstrual_phases", () => {
  for (const v of ["follicular", "ovulatory", "luteal", "menstrual", "n/a"]) {
    const r = validateContext({ menstrual_phase: v });
    assertEquals(r.valid, true, `menstrual_phase '${v}' should be valid`);
  }
});

Deno.test("validateContext - rejects invalid menstrual_phase", () => {
  const r = validateContext({ menstrual_phase: "unknown" });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("menstrual_phase" in r.fields, true);
});

Deno.test("validateContext - medications at max 500 chars", () => {
  const r = validateContext({ medications: "m".repeat(500) });
  assertEquals(r.valid, true);
});

Deno.test("validateContext - medications over 500 chars rejected", () => {
  const r = validateContext({ medications: "m".repeat(501) });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("medications" in r.fields, true);
});

Deno.test("validateContext - notes at max 1000 chars", () => {
  const r = validateContext({ notes: "n".repeat(1000) });
  assertEquals(r.valid, true);
});

Deno.test("validateContext - notes over 1000 chars rejected", () => {
  const r = validateContext({ notes: "n".repeat(1001) });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("notes" in r.fields, true);
});

Deno.test("validateContext - compound: multiple invalid fields", () => {
  const r = validateContext({
    stress_score: 11,
    sleep_quality: 6,
    water_litres: -1,
    exercise_type: "swimming",
    menstrual_phase: "unknown",
  });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("stress_score" in r.fields, true);
    assertEquals("sleep_quality" in r.fields, true);
    assertEquals("water_litres" in r.fields, true);
    assertEquals("exercise_type" in r.fields, true);
    assertEquals("menstrual_phase" in r.fields, true);
  }
});

Deno.test("validateContext - accepts full valid context with all fields", () => {
  const r = validateContext({
    stress_score: 5,
    sleep_hours: 7.5,
    sleep_quality: 3,
    water_litres: 2.0,
    exercise_type: "gym",
    exercise_duration: 60,
    caffeine_mg: 200,
    alcohol_units: 2.5,
    medications: "Ibuprofen",
    menstrual_phase: "luteal",
    notes: "Feeling okay",
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.stress_score, 5);
    assertEquals(r.data.sleep_hours, 7.5);
    assertEquals(r.data.sleep_quality, 3);
    assertEquals(r.data.water_litres, 2.0);
    assertEquals(r.data.exercise_type, "gym");
    assertEquals(r.data.exercise_duration, 60);
    assertEquals(r.data.caffeine_mg, 200);
    assertEquals(r.data.alcohol_units, 2.5);
    assertEquals(r.data.medications, "Ibuprofen");
    assertEquals(r.data.menstrual_phase, "luteal");
    assertEquals(r.data.notes, "Feeling okay");
  }
});

// ============================================================
// validateSymptom — composite validator with boundaries
// ============================================================

Deno.test("validateSymptom - accepts all zeros (min boundary)", () => {
  const r = validateSymptom({
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.bloating, 0);
    assertEquals(r.data.cramping, 0);
    assertEquals(r.data.nausea, 0);
    assertEquals(r.data.urgency, 0);
    assertEquals(r.data.fatigue, 0);
    assertEquals(r.data.overall, 0);
  }
});

Deno.test("validateSymptom - accepts all tens (max boundary)", () => {
  const r = validateSymptom({
    bloating: 10,
    cramping: 10,
    nausea: 10,
    urgency: 10,
    fatigue: 10,
    overall: 10,
  });
  assertEquals(r.valid, true);
  if (r.valid) {
    assertEquals(r.data.bloating, 10);
    assertEquals(r.data.overall, 10);
  }
});

Deno.test("validateSymptom - rejects -1 (below min)", () => {
  const r = validateSymptom({
    bloating: -1,
    cramping: 5,
    nausea: 5,
    urgency: 5,
    fatigue: 5,
    overall: 5,
  });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("bloating" in r.fields, true);
});

Deno.test("validateSymptom - rejects 11 (above max)", () => {
  const r = validateSymptom({
    bloating: 5,
    cramping: 5,
    nausea: 5,
    urgency: 5,
    fatigue: 5,
    overall: 11,
  });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("overall" in r.fields, true);
});

Deno.test("validateSymptom - rejects all missing fields", () => {
  const r = validateSymptom({});
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("bloating" in r.fields, true);
    assertEquals("cramping" in r.fields, true);
    assertEquals("nausea" in r.fields, true);
    assertEquals("urgency" in r.fields, true);
    assertEquals("fatigue" in r.fields, true);
    assertEquals("overall" in r.fields, true);
  }
});

Deno.test("validateSymptom - rejects partial (only some fields)", () => {
  const r = validateSymptom({ bloating: 5, cramping: 3 });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("nausea" in r.fields, true);
    assertEquals("urgency" in r.fields, true);
    assertEquals("fatigue" in r.fields, true);
    assertEquals("overall" in r.fields, true);
    assertEquals("bloating" in r.fields, false);
    assertEquals("cramping" in r.fields, false);
  }
});

Deno.test("validateSymptom - accepts with notes", () => {
  const r = validateSymptom({
    bloating: 3,
    cramping: 5,
    nausea: 0,
    urgency: 10,
    fatigue: 7,
    overall: 6,
    notes: "Feeling rough",
  });
  assertEquals(r.valid, true);
  if (r.valid) assertEquals(r.data.notes, "Feeling rough");
});

Deno.test("validateSymptom - notes at max 1000 chars", () => {
  const r = validateSymptom({
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
    notes: "n".repeat(1000),
  });
  assertEquals(r.valid, true);
});

Deno.test("validateSymptom - notes over 1000 chars rejected", () => {
  const r = validateSymptom({
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
    notes: "n".repeat(1001),
  });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("notes" in r.fields, true);
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
  if (r.valid) {
    assertEquals(r.data.bloating, 3);
    assertEquals(r.data.urgency, 10);
  }
});

Deno.test("validateSymptom - compound: multiple out-of-range fields", () => {
  const r = validateSymptom({
    bloating: 11,
    cramping: -1,
    nausea: 11,
    urgency: -1,
    fatigue: 11,
    overall: -1,
  });
  assertEquals(r.valid, false);
  if (!r.valid) {
    assertEquals("bloating" in r.fields, true);
    assertEquals("cramping" in r.fields, true);
    assertEquals("nausea" in r.fields, true);
    assertEquals("urgency" in r.fields, true);
    assertEquals("fatigue" in r.fields, true);
    assertEquals("overall" in r.fields, true);
  }
});

Deno.test("validateSymptom - rejects non-integer values", () => {
  const r = validateSymptom({
    bloating: 3.5,
    cramping: 5,
    nausea: 5,
    urgency: 5,
    fatigue: 5,
    overall: 5,
  });
  assertEquals(r.valid, false);
  if (!r.valid) assertEquals("bloating" in r.fields, true);
});
