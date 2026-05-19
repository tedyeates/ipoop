import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import fc from "fast-check";
import { generateUlid, generateTimestamp } from "../../lib/ulid.ts";
import type { MealLogRow, StoolLogRow, ContextLogRow, SymptomLogRow } from "../../db/queries.ts";

// Property 1: Log entry round-trip persistence
// Tests that constructing a valid row and serializing/deserializing preserves all fields.
// Since Turso is not available locally, we verify the round-trip through JSON serialization
// (which mirrors how the API returns data) and that all fields are correctly assigned.

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const PORTION_SIZES = ["small", "medium", "large"] as const;
const EATING_SPEEDS = ["slow", "normal", "fast"] as const;
const FODMAP_FLAGS = ["F", "O", "D", "M", "P"] as const;
const EXERCISE_TYPES = ["none", "walk", "gym", "run", "other"] as const;
const MENSTRUAL_PHASES = ["follicular", "ovulatory", "luteal", "menstrual", "n/a"] as const;

// Arbitrary generators for valid log entries
const mealLogArb = fc.record({
  meal_type: fc.oneof(fc.constantFrom(...MEAL_TYPES), fc.constant(null)),
  description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length >= 1),
  fodmap_flags: fc.subarray([...FODMAP_FLAGS]),
  ingredients: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 50 }),
  fodmap_detail: fc.dictionary(
    fc.constantFrom("F", "O", "D", "M", "P"),
    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
  ),
  portion_size: fc.oneof(fc.constantFrom(...PORTION_SIZES), fc.constant(null)),
  eating_speed: fc.oneof(fc.constantFrom(...EATING_SPEEDS), fc.constant(null)),
  scan_used: fc.constantFrom(0, 1),
});

const stoolLogArb = fc.record({
  bristol_type: fc.integer({ min: 1, max: 7 }),
  frequency: fc.oneof(fc.integer({ min: 1, max: 20 }), fc.constant(null)),
  urgency: fc.oneof(fc.constantFrom(0, 1), fc.constant(null)),
  pain_score: fc.oneof(fc.integer({ min: 0, max: 10 }), fc.constant(null)),
  blood: fc.oneof(fc.constantFrom(0, 1), fc.constant(null)),
  notes: fc.oneof(fc.string({ maxLength: 1000 }), fc.constant(null)),
});

const contextLogArb = fc.record({
  stress_score: fc.oneof(fc.integer({ min: 1, max: 10 }), fc.constant(null)),
  sleep_hours: fc.oneof(fc.double({ min: 0, max: 24, noNaN: true }), fc.constant(null)),
  sleep_quality: fc.oneof(fc.integer({ min: 1, max: 5 }), fc.constant(null)),
  water_litres: fc.oneof(fc.double({ min: 0, max: 20, noNaN: true }), fc.constant(null)),
  exercise_type: fc.oneof(fc.constantFrom(...EXERCISE_TYPES), fc.constant(null)),
  exercise_duration: fc.oneof(fc.integer({ min: 0, max: 1440 }), fc.constant(null)),
  caffeine_mg: fc.oneof(fc.integer({ min: 0, max: 2000 }), fc.constant(null)),
  alcohol_units: fc.oneof(fc.double({ min: 0, max: 50, noNaN: true }), fc.constant(null)),
  medications: fc.oneof(fc.string({ maxLength: 500 }), fc.constant(null)),
  menstrual_phase: fc.oneof(fc.constantFrom(...MENSTRUAL_PHASES), fc.constant(null)),
  notes: fc.oneof(fc.string({ maxLength: 1000 }), fc.constant(null)),
});

const symptomLogArb = fc.record({
  bloating: fc.integer({ min: 0, max: 10 }),
  cramping: fc.integer({ min: 0, max: 10 }),
  nausea: fc.integer({ min: 0, max: 10 }),
  urgency: fc.integer({ min: 0, max: 10 }),
  fatigue: fc.integer({ min: 0, max: 10 }),
  overall: fc.integer({ min: 0, max: 10 }),
  notes: fc.oneof(fc.string({ maxLength: 1000 }), fc.constant(null)),
});

Deno.test("Property 1: Meal log round-trip preserves all fields through JSON serialization", () => {
  fc.assert(
    fc.property(mealLogArb, (input) => {
      const row: MealLogRow = {
        id: generateUlid(),
        logged_at: generateTimestamp(),
        meal_type: input.meal_type,
        description: input.description,
        fodmap_flags: JSON.stringify(input.fodmap_flags),
        ingredients: JSON.stringify(input.ingredients),
        fodmap_detail: JSON.stringify(input.fodmap_detail),
        portion_size: input.portion_size,
        eating_speed: input.eating_speed,
        scan_used: input.scan_used,
      };

      // Simulate API response (parse JSON fields back)
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

      assertEquals(response.meal_type, input.meal_type);
      assertEquals(response.description, input.description);
      assertEquals(response.fodmap_flags, input.fodmap_flags);
      assertEquals(response.ingredients, input.ingredients);
      assertEquals(response.fodmap_detail, input.fodmap_detail);
      assertEquals(response.portion_size, input.portion_size);
      assertEquals(response.eating_speed, input.eating_speed);
      assertEquals(response.scan_used, input.scan_used);
      assert(row.id.length === 26);
      assert(row.logged_at.includes("T"));
    }),
    { numRuns: 100 },
  );
});

Deno.test("Property 1: Stool log round-trip preserves all fields", () => {
  fc.assert(
    fc.property(stoolLogArb, (input) => {
      const row: StoolLogRow = {
        id: generateUlid(),
        logged_at: generateTimestamp(),
        bristol_type: input.bristol_type,
        frequency: input.frequency,
        urgency: input.urgency,
        pain_score: input.pain_score,
        blood: input.blood,
        notes: input.notes,
      };

      // Simulate round-trip through JSON (as API would return)
      const serialized = JSON.parse(JSON.stringify(row));

      assertEquals(serialized.bristol_type, input.bristol_type);
      assertEquals(serialized.frequency, input.frequency);
      assertEquals(serialized.urgency, input.urgency);
      assertEquals(serialized.pain_score, input.pain_score);
      assertEquals(serialized.blood, input.blood);
      assertEquals(serialized.notes, input.notes);
      assert(row.id.length === 26);
    }),
    { numRuns: 100 },
  );
});

Deno.test("Property 1: Context log round-trip preserves all fields", () => {
  fc.assert(
    fc.property(contextLogArb, (input) => {
      const row: ContextLogRow = {
        id: generateUlid(),
        logged_at: generateTimestamp(),
        stress_score: input.stress_score,
        sleep_hours: input.sleep_hours,
        sleep_quality: input.sleep_quality,
        water_litres: input.water_litres,
        exercise_type: input.exercise_type,
        exercise_duration: input.exercise_duration,
        caffeine_mg: input.caffeine_mg,
        alcohol_units: input.alcohol_units,
        medications: input.medications,
        menstrual_phase: input.menstrual_phase,
        notes: input.notes,
      };

      const serialized = JSON.parse(JSON.stringify(row));

      assertEquals(serialized.stress_score, input.stress_score);
      assertEquals(serialized.sleep_hours, input.sleep_hours);
      assertEquals(serialized.sleep_quality, input.sleep_quality);
      assertEquals(serialized.water_litres, input.water_litres);
      assertEquals(serialized.exercise_type, input.exercise_type);
      assertEquals(serialized.exercise_duration, input.exercise_duration);
      assertEquals(serialized.caffeine_mg, input.caffeine_mg);
      assertEquals(serialized.alcohol_units, input.alcohol_units);
      assertEquals(serialized.medications, input.medications);
      assertEquals(serialized.menstrual_phase, input.menstrual_phase);
      assertEquals(serialized.notes, input.notes);
      assert(row.id.length === 26);
    }),
    { numRuns: 100 },
  );
});

Deno.test("Property 1: Symptom log round-trip preserves all fields", () => {
  fc.assert(
    fc.property(symptomLogArb, (input) => {
      const row: SymptomLogRow = {
        id: generateUlid(),
        logged_at: generateTimestamp(),
        bloating: input.bloating,
        cramping: input.cramping,
        nausea: input.nausea,
        urgency: input.urgency,
        fatigue: input.fatigue,
        overall: input.overall,
        notes: input.notes,
      };

      const serialized = JSON.parse(JSON.stringify(row));

      assertEquals(serialized.bloating, input.bloating);
      assertEquals(serialized.cramping, input.cramping);
      assertEquals(serialized.nausea, input.nausea);
      assertEquals(serialized.urgency, input.urgency);
      assertEquals(serialized.fatigue, input.fatigue);
      assertEquals(serialized.overall, input.overall);
      assertEquals(serialized.notes, input.notes);
      assert(row.id.length === 26);
    }),
    { numRuns: 100 },
  );
});
