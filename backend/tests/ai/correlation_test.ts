import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeDelayHours,
  findCorrelations,
  isWithinTransitWindow,
  meetsSymptomThreshold,
  getTriggeredDimensions,
  type MealEvent,
  type SymptomEvent,
} from "../../ai/correlation.ts";

// Helper: create a symptom event with all dimensions at a given score
function makeSymptom(
  id: string,
  logged_at: string,
  scores: Partial<SymptomEvent> = {},
): SymptomEvent {
  return {
    id,
    logged_at,
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
    ...scores,
  };
}

// --- meetsSymptomThreshold ---

Deno.test("meetsSymptomThreshold — all below 4 returns false", () => {
  const s = makeSymptom("s1", "2024-01-01T12:00:00Z", {
    bloating: 3,
    cramping: 2,
    nausea: 1,
    urgency: 3,
    fatigue: 0,
    overall: 3,
  });
  assertEquals(meetsSymptomThreshold(s), false);
});

Deno.test("meetsSymptomThreshold — one dimension at 4 returns true", () => {
  const s = makeSymptom("s1", "2024-01-01T12:00:00Z", { bloating: 4 });
  assertEquals(meetsSymptomThreshold(s), true);
});

Deno.test("meetsSymptomThreshold — dimension at 3 returns false", () => {
  const s = makeSymptom("s1", "2024-01-01T12:00:00Z", {
    bloating: 3,
    cramping: 3,
    nausea: 3,
    urgency: 3,
    fatigue: 3,
    overall: 3,
  });
  assertEquals(meetsSymptomThreshold(s), false);
});

Deno.test("meetsSymptomThreshold — multiple dimensions above threshold", () => {
  const s = makeSymptom("s1", "2024-01-01T12:00:00Z", {
    bloating: 7,
    cramping: 5,
  });
  assertEquals(meetsSymptomThreshold(s), true);
});

// --- getTriggeredDimensions ---

Deno.test("getTriggeredDimensions — returns only dimensions ≥4", () => {
  const s = makeSymptom("s1", "2024-01-01T12:00:00Z", {
    bloating: 5,
    cramping: 3,
    nausea: 4,
    urgency: 2,
    fatigue: 8,
    overall: 1,
  });
  assertEquals(getTriggeredDimensions(s), ["bloating", "nausea", "fatigue"]);
});

// --- isWithinTransitWindow ---

Deno.test("isWithinTransitWindow — exactly 6 hours → correlated", () => {
  const meal = "2024-01-01T06:00:00Z";
  const symptom = "2024-01-01T12:00:00Z"; // +6h
  assertEquals(isWithinTransitWindow(meal, symptom), true);
});

Deno.test("isWithinTransitWindow — exactly 24 hours → correlated", () => {
  const meal = "2024-01-01T06:00:00Z";
  const symptom = "2024-01-02T06:00:00Z"; // +24h
  assertEquals(isWithinTransitWindow(meal, symptom), true);
});

Deno.test("isWithinTransitWindow — 12 hours (middle of window) → correlated", () => {
  const meal = "2024-01-01T06:00:00Z";
  const symptom = "2024-01-01T18:00:00Z"; // +12h
  assertEquals(isWithinTransitWindow(meal, symptom), true);
});

Deno.test("isWithinTransitWindow — before 6 hours → not correlated", () => {
  const meal = "2024-01-01T06:00:00Z";
  const symptom = "2024-01-01T11:59:59Z"; // just under 6h
  assertEquals(isWithinTransitWindow(meal, symptom), false);
});

Deno.test("isWithinTransitWindow — after 24 hours → not correlated", () => {
  const meal = "2024-01-01T06:00:00Z";
  const symptom = "2024-01-02T06:00:01Z"; // just over 24h
  assertEquals(isWithinTransitWindow(meal, symptom), false);
});

Deno.test("isWithinTransitWindow — symptom before meal → not correlated", () => {
  const meal = "2024-01-01T12:00:00Z";
  const symptom = "2024-01-01T06:00:00Z"; // before meal
  assertEquals(isWithinTransitWindow(meal, symptom), false);
});

// --- computeDelayHours ---

Deno.test("computeDelayHours — 6 hours", () => {
  assertEquals(
    computeDelayHours("2024-01-01T06:00:00Z", "2024-01-01T12:00:00Z"),
    6,
  );
});

Deno.test("computeDelayHours — 24 hours", () => {
  assertEquals(
    computeDelayHours("2024-01-01T06:00:00Z", "2024-01-02T06:00:00Z"),
    24,
  );
});

// --- findCorrelations ---

Deno.test("findCorrelations — single meal + symptom within window", () => {
  const meals: MealEvent[] = [{ id: "m1", logged_at: "2024-01-01T08:00:00Z" }];
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T20:00:00Z", { bloating: 6 }), // +12h, ≥4
  ];

  const results = findCorrelations(meals, symptoms);
  assertEquals(results.length, 1);
  assertEquals(results[0].meal_id, "m1");
  assertEquals(results[0].symptom_id, "s1");
  assertEquals(results[0].delay_hours, 12);
  assertEquals(results[0].triggered_dimensions, ["bloating"]);
});

Deno.test("findCorrelations — symptom below threshold not correlated", () => {
  const meals: MealEvent[] = [{ id: "m1", logged_at: "2024-01-01T08:00:00Z" }];
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T20:00:00Z", { bloating: 3 }), // +12h but <4
  ];

  const results = findCorrelations(meals, symptoms);
  assertEquals(results.length, 0);
});

Deno.test("findCorrelations — symptom outside window not correlated", () => {
  const meals: MealEvent[] = [{ id: "m1", logged_at: "2024-01-01T08:00:00Z" }];
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T10:00:00Z", { bloating: 8 }), // +2h, outside window
  ];

  const results = findCorrelations(meals, symptoms);
  assertEquals(results.length, 0);
});

Deno.test("findCorrelations — multiple meals, one symptom correlates with both", () => {
  const meals: MealEvent[] = [
    { id: "m1", logged_at: "2024-01-01T06:00:00Z" },
    { id: "m2", logged_at: "2024-01-01T10:00:00Z" },
  ];
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T18:00:00Z", { cramping: 5 }), // m1: +12h, m2: +8h
  ];

  const results = findCorrelations(meals, symptoms);
  assertEquals(results.length, 2);
  assertEquals(results[0].meal_id, "m1");
  assertEquals(results[1].meal_id, "m2");
});

Deno.test("findCorrelations — multiple symptoms, overlapping windows", () => {
  const meals: MealEvent[] = [{ id: "m1", logged_at: "2024-01-01T08:00:00Z" }];
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T14:00:00Z", { nausea: 4 }), // +6h exact
    makeSymptom("s2", "2024-01-01T20:00:00Z", { urgency: 7 }), // +12h
    makeSymptom("s3", "2024-01-02T09:00:00Z", { fatigue: 5 }), // +25h, outside
  ];

  const results = findCorrelations(meals, symptoms);
  assertEquals(results.length, 2);
  assertEquals(results[0].symptom_id, "s1");
  assertEquals(results[1].symptom_id, "s2");
});

Deno.test("findCorrelations — empty meals returns no correlations", () => {
  const symptoms: SymptomEvent[] = [
    makeSymptom("s1", "2024-01-01T20:00:00Z", { bloating: 8 }),
  ];
  assertEquals(findCorrelations([], symptoms).length, 0);
});

Deno.test("findCorrelations — empty symptoms returns no correlations", () => {
  const meals: MealEvent[] = [{ id: "m1", logged_at: "2024-01-01T08:00:00Z" }];
  assertEquals(findCorrelations(meals, []).length, 0);
});
