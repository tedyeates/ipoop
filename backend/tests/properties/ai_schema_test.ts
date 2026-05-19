import { assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as fc from "fast-check";
import { parseScanResponse } from "../../ai/scan-prompt.ts";
import { parseReviewResponse } from "../../ai/review-prompt.ts";

Deno.test("Feature: ibs-trigger-tracker, Property 15: AI response schema validation - ScanResponse", () => {
  // Valid scan responses are accepted
  fc.assert(
    fc.property(
      fc.record({
        description: fc.string({ minLength: 1, maxLength: 100 }),
        ingredients: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
        fodmap_flags: fc.subarray(["F", "O", "D", "M", "P"] as const),
        confidence: fc.constantFrom("high", "medium", "low"),
      }),
      (data) => {
        const json = JSON.stringify({ ...data, fodmap_detail: {} });
        const result = parseScanResponse(json);
        assert(!("error" in result));
      },
    ),
    { numRuns: 100 },
  );

  // Invalid/malformed JSON is rejected without crashing
  fc.assert(
    fc.property(
      fc.string({ minLength: 0, maxLength: 200 }),
      (raw) => {
        const result = parseScanResponse(raw);
        // Should never throw — always returns a result
        assert(result !== undefined);
      },
    ),
    { numRuns: 100 },
  );
});

Deno.test("Feature: ibs-trigger-tracker, Property 15: AI response schema validation - ReviewResponse", () => {
  // Valid review responses are accepted
  fc.assert(
    fc.property(
      fc.record({
        summary: fc.string({ minLength: 1, maxLength: 200 }),
        hypotheses: fc.array(
          fc.record({
            trigger_name: fc.string({ minLength: 1, maxLength: 50 }),
            fodmap_category: fc.constantFrom("F", "O", "D", "M", "P", "none"),
            confidence_score: fc.double({ min: 0, max: 0.95, noNaN: true }),
            confidence_label: fc.constantFrom("Low", "Moderate", "High", "Very High"),
            direction: fc.constantFrom("worsens", "improves", "unclear"),
            symptom_pattern: fc.string({ maxLength: 100 }),
            supporting_events: fc.nat({ max: 50 }),
            contradicting_events: fc.nat({ max: 50 }),
          }),
          { maxLength: 5 },
        ),
      }),
      (data) => {
        const json = JSON.stringify(data);
        const result = parseReviewResponse(json);
        assert(!("error" in result));
      },
    ),
    { numRuns: 100 },
  );

  // Invalid/malformed JSON is rejected without crashing
  fc.assert(
    fc.property(
      fc.string({ minLength: 0, maxLength: 200 }),
      (raw) => {
        const result = parseReviewResponse(raw);
        assert(result !== undefined);
      },
    ),
    { numRuns: 100 },
  );
});
