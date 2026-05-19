import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as fc from "fast-check";
import {
  getConfidenceLabel,
  applyDataSufficiencyCap,
  applySupportingEventsCap,
  applyConfounderReduction,
} from "../../ai/confidence.ts";

Deno.test("Feature: ibs-trigger-tracker, Property 7: Confidence label assignment", () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0, max: 0.95, noNaN: true }),
      (score) => {
        const label = getConfidenceLabel(score);
        if (score >= 0.85) assertEquals(label, "Very High");
        else if (score >= 0.65) assertEquals(label, "High");
        else if (score >= 0.40) assertEquals(label, "Moderate");
        else assertEquals(label, "Low");
      },
    ),
    { numRuns: 200 },
  );
});

Deno.test("Feature: ibs-trigger-tracker, Property 8: Confidence caps based on data sufficiency and supporting events", () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0, max: 0.95, noNaN: true }),
      fc.integer({ min: 1, max: 90 }),
      fc.integer({ min: 0, max: 20 }),
      (score, days, events) => {
        const cappedByDays = applyDataSufficiencyCap(score, days);
        if (days < 7) assert(cappedByDays <= 0.39);
        else if (days < 14) assert(cappedByDays <= 0.64);
        else assert(cappedByDays <= score);

        const cappedByEvents = applySupportingEventsCap(score, events);
        if (events < 3) assert(cappedByEvents <= 0.50);
        else assert(cappedByEvents <= score);
      },
    ),
    { numRuns: 200 },
  );
});

Deno.test("Feature: ibs-trigger-tracker, Property 9: Confounder confidence reduction", () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0.15, max: 0.95, noNaN: true }),
      (score) => {
        const reduced = applyConfounderReduction(score, true);
        const unreduced = applyConfounderReduction(score, false);
        assert(unreduced - reduced >= 0.15 - 1e-10); // floating point tolerance
        assertEquals(unreduced, score);
      },
    ),
    { numRuns: 200 },
  );
});
