import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applyConfounderReduction,
  applyDataSufficiencyCap,
  applySupportingEventsCap,
  assignLabel,
  computeConfidence,
  hasElevatedConfounders,
} from "../../ai/confidence.ts";

Deno.test("assignLabel — Low for scores 0.00–0.39", () => {
  assertEquals(assignLabel(0.00), "Low");
  assertEquals(assignLabel(0.20), "Low");
  assertEquals(assignLabel(0.39), "Low");
});

Deno.test("assignLabel — Moderate for scores 0.40–0.64", () => {
  assertEquals(assignLabel(0.40), "Moderate");
  assertEquals(assignLabel(0.50), "Moderate");
  assertEquals(assignLabel(0.64), "Moderate");
});

Deno.test("assignLabel — High for scores 0.65–0.84", () => {
  assertEquals(assignLabel(0.65), "High");
  assertEquals(assignLabel(0.75), "High");
  assertEquals(assignLabel(0.84), "High");
});

Deno.test("assignLabel — Very High for scores 0.85–1.00", () => {
  assertEquals(assignLabel(0.85), "Very High");
  assertEquals(assignLabel(0.95), "Very High");
  assertEquals(assignLabel(1.00), "Very High");
});

Deno.test("applyDataSufficiencyCap — <7 days caps at 0.39", () => {
  assertEquals(applyDataSufficiencyCap(0.90, 0), 0.39);
  assertEquals(applyDataSufficiencyCap(0.90, 6), 0.39);
  assertEquals(applyDataSufficiencyCap(0.30, 5), 0.30); // already below cap
});

Deno.test("applyDataSufficiencyCap — <14 days caps at 0.64", () => {
  assertEquals(applyDataSufficiencyCap(0.90, 7), 0.64);
  assertEquals(applyDataSufficiencyCap(0.90, 13), 0.64);
  assertEquals(applyDataSufficiencyCap(0.50, 10), 0.50); // already below cap
});

Deno.test("applyDataSufficiencyCap — ≥14 days no cap", () => {
  assertEquals(applyDataSufficiencyCap(0.90, 14), 0.90);
  assertEquals(applyDataSufficiencyCap(0.90, 30), 0.90);
});

Deno.test("applySupportingEventsCap — <3 events caps at 0.50", () => {
  assertEquals(applySupportingEventsCap(0.80, 0), 0.50);
  assertEquals(applySupportingEventsCap(0.80, 2), 0.50);
  assertEquals(applySupportingEventsCap(0.40, 1), 0.40); // already below cap
});

Deno.test("applySupportingEventsCap — ≥3 events no cap", () => {
  assertEquals(applySupportingEventsCap(0.80, 3), 0.80);
  assertEquals(applySupportingEventsCap(0.80, 10), 0.80);
});

Deno.test("hasElevatedConfounders — stress ≥7", () => {
  assertEquals(hasElevatedConfounders({ stress: 7 }), true);
  assertEquals(hasElevatedConfounders({ stress: 10 }), true);
  assertEquals(hasElevatedConfounders({ stress: 6 }), false);
});

Deno.test("hasElevatedConfounders — sleep_quality ≤2", () => {
  assertEquals(hasElevatedConfounders({ sleep_quality: 2 }), true);
  assertEquals(hasElevatedConfounders({ sleep_quality: 1 }), true);
  assertEquals(hasElevatedConfounders({ sleep_quality: 3 }), false);
});

Deno.test("hasElevatedConfounders — water <1.0L", () => {
  assertEquals(hasElevatedConfounders({ water_litres: 0.5 }), true);
  assertEquals(hasElevatedConfounders({ water_litres: 0.0 }), true);
  assertEquals(hasElevatedConfounders({ water_litres: 1.0 }), false);
  assertEquals(hasElevatedConfounders({ water_litres: 2.0 }), false);
});

Deno.test("hasElevatedConfounders — no confounders", () => {
  assertEquals(hasElevatedConfounders({}), false);
  assertEquals(hasElevatedConfounders({ stress: 5, sleep_quality: 4, water_litres: 2.0 }), false);
});

Deno.test("applyConfounderReduction — reduces by 0.15 when elevated", () => {
  const result = applyConfounderReduction(0.80, { stress: 8 });
  assertEquals(result, 0.65);
});

Deno.test("applyConfounderReduction — no reduction when not elevated", () => {
  assertEquals(applyConfounderReduction(0.80, { stress: 5 }), 0.80);
  assertEquals(applyConfounderReduction(0.80, undefined), 0.80);
});

Deno.test("applyConfounderReduction — floors at 0", () => {
  const result = applyConfounderReduction(0.10, { stress: 9 });
  assertEquals(result, 0);
});

Deno.test("computeConfidence — full pipeline with no caps or confounders", () => {
  const result = computeConfidence({
    rawScore: 0.75,
    daysOfData: 30,
    supportingEvents: 5,
  });
  assertEquals(result.score, 0.75);
  assertEquals(result.label, "High");
});

Deno.test("computeConfidence — data sufficiency cap dominates", () => {
  const result = computeConfidence({
    rawScore: 0.90,
    daysOfData: 5,
    supportingEvents: 10,
  });
  assertEquals(result.score, 0.39);
  assertEquals(result.label, "Low");
});

Deno.test("computeConfidence — supporting events cap", () => {
  const result = computeConfidence({
    rawScore: 0.80,
    daysOfData: 30,
    supportingEvents: 2,
  });
  assertEquals(result.score, 0.50);
  assertEquals(result.label, "Moderate");
});

Deno.test("computeConfidence — confounder reduction + data cap", () => {
  const result = computeConfidence({
    rawScore: 0.80,
    daysOfData: 10, // <14 days → max 0.64
    supportingEvents: 5,
    confounders: { stress: 8 }, // reduces by 0.15 → 0.65, then capped to 0.64
  });
  assertEquals(result.score, 0.64);
  assertEquals(result.label, "Moderate");
});

Deno.test("computeConfidence — all caps combined", () => {
  const result = computeConfidence({
    rawScore: 0.90,
    daysOfData: 5, // <7 days → max 0.39
    supportingEvents: 1, // <3 → max 0.50
    confounders: { water_litres: 0.5 }, // reduces by 0.15 → 0.75
  });
  // 0.90 → confounder → 0.75 → events cap → 0.50 → data cap → 0.39
  assertEquals(result.score, 0.39);
  assertEquals(result.label, "Low");
});
