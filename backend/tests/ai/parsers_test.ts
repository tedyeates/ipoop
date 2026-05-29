import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateScanResponse } from "../../routes/scan.ts";
import { parseReviewResponse } from "../../routes/review.ts";

// ─── validateScanResponse ────────────────────────────────────────────────────

Deno.test("validateScanResponse — valid complete response parsed correctly", () => {
  const input = {
    description: "Pasta with garlic bread",
    ingredients: ["pasta", "garlic", "butter", "wheat flour"],
    fodmap_flags: ["F", "O"],
    fodmap_detail: { F: ["garlic"], O: ["wheat flour"] },
    confidence: "high" as const,
    notes: "Garlic is dose-dependent",
  };
  const result = validateScanResponse(input);
  assertEquals(result, input);
});

Deno.test("validateScanResponse — valid minimal response (no notes)", () => {
  const input = {
    description: "Plain rice",
    ingredients: ["rice"],
    fodmap_flags: [] as string[],
    fodmap_detail: {},
    confidence: "low" as const,
  };
  const result = validateScanResponse(input);
  assertEquals(result, input);
});

Deno.test("validateScanResponse — extra fields ignored gracefully", () => {
  const input = {
    description: "Salad",
    ingredients: ["lettuce", "tomato"],
    fodmap_flags: ["M"],
    fodmap_detail: { M: ["tomato"] },
    confidence: "medium",
    extra_field: "should be ignored",
    another: 123,
  };
  const result = validateScanResponse(input);
  assertEquals(result, {
    description: "Salad",
    ingredients: ["lettuce", "tomato"],
    fodmap_flags: ["M"],
    fodmap_detail: { M: ["tomato"] },
    confidence: "medium",
  });
});

Deno.test("validateScanResponse — null input returns null", () => {
  assertEquals(validateScanResponse(null), null);
});

Deno.test("validateScanResponse — non-object input returns null", () => {
  assertEquals(validateScanResponse("string"), null);
  assertEquals(validateScanResponse(42), null);
  assertEquals(validateScanResponse(undefined), null);
});

Deno.test("validateScanResponse — missing description returns null", () => {
  const input = {
    ingredients: ["rice"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "low",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — missing ingredients returns null", () => {
  const input = {
    description: "Rice",
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "low",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — invalid confidence value returns null", () => {
  const input = {
    description: "Rice",
    ingredients: ["rice"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "very_high",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — invalid fodmap_flags returns null", () => {
  const input = {
    description: "Rice",
    ingredients: ["rice"],
    fodmap_flags: ["X"],
    fodmap_detail: {},
    confidence: "low",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — non-string in ingredients returns null", () => {
  const input = {
    description: "Rice",
    ingredients: ["rice", 123],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "low",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — fodmap_detail with non-array value returns null", () => {
  const input = {
    description: "Rice",
    ingredients: ["rice"],
    fodmap_flags: ["F"],
    fodmap_detail: { F: "not an array" },
    confidence: "low",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse — notes as non-string returns null", () => {
  const input = {
    description: "Rice",
    ingredients: ["rice"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "low",
    notes: 42,
  };
  assertEquals(validateScanResponse(input), null);
});

// ─── parseReviewResponse ─────────────────────────────────────────────────────

const validHypothesis = {
  trigger_name: "Garlic",
  fodmap_category: "F",
  confidence_score: 0.72,
  confidence_label: "High",
  direction: "worsens",
  symptom_pattern: "Bloating 6-12h after meals with garlic",
  supporting_events: 5,
  contradicting_events: 1,
};

Deno.test("parseReviewResponse — valid JSON parsed correctly", () => {
  const input = JSON.stringify({
    summary: "Garlic appears to be a primary trigger.",
    hypotheses: [validHypothesis],
  });
  const result = parseReviewResponse(input);
  assertEquals(result.summary, "Garlic appears to be a primary trigger.");
  assertEquals(result.hypotheses.length, 1);
  assertEquals(result.hypotheses[0].trigger_name, "Garlic");
  assertEquals(result.hypotheses[0].confidence_score, 0.72);
  assertEquals(result.hypotheses[0].notes, undefined);
});

Deno.test("parseReviewResponse — strips markdown code fences", () => {
  const input = "```json\n" + JSON.stringify({
    summary: "Analysis complete.",
    hypotheses: [validHypothesis],
  }) + "\n```";
  const result = parseReviewResponse(input);
  assertEquals(result.summary, "Analysis complete.");
  assertEquals(result.hypotheses.length, 1);
});

Deno.test("parseReviewResponse — hypothesis with optional notes", () => {
  const withNotes = { ...validHypothesis, notes: "Dose-dependent effect" };
  const input = JSON.stringify({
    summary: "Summary text.",
    hypotheses: [withNotes],
  });
  const result = parseReviewResponse(input);
  assertEquals(result.hypotheses[0].notes, "Dose-dependent effect");
});

Deno.test("parseReviewResponse — extra fields in hypothesis ignored", () => {
  const withExtra = { ...validHypothesis, extra_field: "ignored", foo: 99 };
  const input = JSON.stringify({
    summary: "Summary.",
    hypotheses: [withExtra],
  });
  const result = parseReviewResponse(input);
  assertEquals(result.hypotheses[0].trigger_name, "Garlic");
  // deno-lint-ignore no-explicit-any
  assertEquals((result.hypotheses[0] as any).extra_field, undefined);
});

Deno.test("parseReviewResponse — malformed JSON throws error", () => {
  assertThrows(
    () => parseReviewResponse("not valid json {{{"),
    Error,
  );
});

Deno.test("parseReviewResponse — missing summary throws error", () => {
  const input = JSON.stringify({ hypotheses: [validHypothesis] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "summary",
  );
});

Deno.test("parseReviewResponse — empty summary throws error", () => {
  const input = JSON.stringify({ summary: "", hypotheses: [validHypothesis] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "summary",
  );
});

Deno.test("parseReviewResponse — missing hypotheses throws error", () => {
  const input = JSON.stringify({ summary: "Valid summary" });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "hypotheses",
  );
});

Deno.test("parseReviewResponse — hypotheses not array throws error", () => {
  const input = JSON.stringify({ summary: "Valid", hypotheses: "not array" });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "hypotheses",
  );
});

Deno.test("parseReviewResponse — missing trigger_name throws error", () => {
  const bad = { ...validHypothesis, trigger_name: undefined };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "trigger_name",
  );
});

Deno.test("parseReviewResponse — invalid confidence_score (>0.95) throws error", () => {
  const bad = { ...validHypothesis, confidence_score: 0.99 };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "confidence_score",
  );
});

Deno.test("parseReviewResponse — invalid confidence_score (negative) throws error", () => {
  const bad = { ...validHypothesis, confidence_score: -0.1 };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "confidence_score",
  );
});

Deno.test("parseReviewResponse — confidence_score as string throws error", () => {
  const bad = { ...validHypothesis, confidence_score: "0.5" };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "confidence_score",
  );
});

Deno.test("parseReviewResponse — invalid confidence_label throws error", () => {
  const bad = { ...validHypothesis, confidence_label: "Medium" };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "confidence_label",
  );
});

Deno.test("parseReviewResponse — invalid direction throws error", () => {
  const bad = { ...validHypothesis, direction: "neutral" };
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "direction",
  );
});

Deno.test("parseReviewResponse — missing supporting_events throws error", () => {
  const { supporting_events: _, ...bad } = validHypothesis;
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "supporting_events",
  );
});

Deno.test("parseReviewResponse — missing contradicting_events throws error", () => {
  const { contradicting_events: _, ...bad } = validHypothesis;
  const input = JSON.stringify({ summary: "Valid", hypotheses: [bad] });
  assertThrows(
    () => parseReviewResponse(input),
    Error,
    "contradicting_events",
  );
});
