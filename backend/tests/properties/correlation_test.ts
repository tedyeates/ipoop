import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as fc from "fast-check";
import { findCorrelatedPairs } from "../../ai/correlation.ts";
import type { MealLogRow, SymptomLogRow } from "../../db/queries.ts";

function makeMeal(logged_at: string): MealLogRow {
  return {
    id: "TEST", logged_at, meal_type: null, description: "test",
    fodmap_flags: "[]", ingredients: "[]", fodmap_detail: "{}",
    portion_size: null, eating_speed: null, scan_used: 0,
  };
}

function makeSymptom(logged_at: string, overall: number): SymptomLogRow {
  return {
    id: "TEST", logged_at, bloating: overall, cramping: 0,
    nausea: 0, urgency: 0, fatigue: 0, overall, notes: null,
  };
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

Deno.test("Feature: ibs-trigger-tracker, Property 6: Transit window correlation correctness", () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date("2024-01-01"), max: new Date("2025-12-31") }),
      fc.integer({ min: -48, max: 48 }), // offset in hours
      fc.integer({ min: 0, max: 10 }), // symptom severity
      (mealDate, offsetHours, severity) => {
        const mealTime = mealDate.getTime();
        const symptomTime = mealTime + offsetHours * 60 * 60 * 1000;
        const deltaMs = symptomTime - mealTime;

        const meals = [makeMeal(new Date(mealTime).toISOString())];
        const symptoms = [makeSymptom(new Date(symptomTime).toISOString(), severity)];

        const pairs = findCorrelatedPairs(meals, symptoms);

        const inWindow = deltaMs >= SIX_HOURS_MS && deltaMs <= TWENTY_FOUR_HOURS_MS;
        const isSignificant = severity >= 4;

        if (inWindow && isSignificant) {
          assertEquals(pairs.length, 1);
        } else {
          assertEquals(pairs.length, 0);
        }
      },
    ),
    { numRuns: 200 },
  );
});
