import type { MealLogRow, StoolLogRow, ContextLogRow, SymptomLogRow } from "../db/queries.ts";

export interface Hypothesis {
  trigger_name: string;
  fodmap_category: string;
  confidence_score: number;
  confidence_label: "Low" | "Moderate" | "High" | "Very High";
  direction: "worsens" | "improves" | "unclear";
  symptom_pattern: string;
  supporting_events: number;
  contradicting_events: number;
  notes?: string;
}

export interface ReviewResponse {
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses: Hypothesis[];
}

export function buildReviewPrompt(
  meals: MealLogRow[],
  stools: StoolLogRow[],
  contexts: ContextLogRow[],
  symptoms: SymptomLogRow[],
  daysOfData: number,
): string {
  return `You are an IBS trigger analysis engine. Analyse the following food and health log data to identify probable dietary triggers.

DATA WINDOW: ${daysOfData} days of data, ${meals.length + stools.length + contexts.length + symptoms.length} total entries.

MEAL LOGS (${meals.length} entries):
${JSON.stringify(meals.map((m) => ({ logged_at: m.logged_at, description: m.description, fodmap_flags: m.fodmap_flags, ingredients: m.ingredients, portion_size: m.portion_size })))}

STOOL LOGS (${stools.length} entries):
${JSON.stringify(stools.map((s) => ({ logged_at: s.logged_at, bristol_type: s.bristol_type, pain_score: s.pain_score, urgency: s.urgency })))}

CONTEXT LOGS (${contexts.length} entries):
${JSON.stringify(contexts.map((c) => ({ logged_at: c.logged_at, stress_score: c.stress_score, sleep_quality: c.sleep_quality, water_litres: c.water_litres })))}

SYMPTOM LOGS (${symptoms.length} entries):
${JSON.stringify(symptoms.map((s) => ({ logged_at: s.logged_at, bloating: s.bloating, cramping: s.cramping, nausea: s.nausea, urgency: s.urgency, fatigue: s.fatigue, overall: s.overall })))}

ANALYSIS RULES:
- Correlate meals with symptoms occurring 6-24 hours later (transit window)
- Consider FODMAP categories and specific ingredients
- Account for confounders: stress >= 7, sleep quality <= 2, water < 1.0L reduce confidence by at least 0.15
- Consider dose-dependency: small portions may be tolerated while large portions cause symptoms
- Consider cumulative FODMAP load: multiple moderate-FODMAP items in one meal
- Confidence caps: <7 days data = max Low (0.39), <14 days = max Moderate (0.64), <3 supporting events = max 0.50
- Maximum confidence score is 0.95

Respond ONLY with valid JSON matching this schema:
{
  "summary": "Plain-English summary paragraph of findings",
  "hypotheses": [
    {
      "trigger_name": "Name of the trigger food/ingredient",
      "fodmap_category": "F, O, D, M, P, or multiple/none",
      "confidence_score": 0.00-0.95,
      "confidence_label": "Low|Moderate|High|Very High",
      "direction": "worsens|improves|unclear",
      "symptom_pattern": "Description of the symptom pattern observed",
      "supporting_events": 0,
      "contradicting_events": 0,
      "notes": "Optional additional context"
    }
  ]
}`;
}

const VALID_DIRECTIONS = new Set(["worsens", "improves", "unclear"]);
const VALID_LABELS = new Set(["Low", "Moderate", "High", "Very High"]);

export function parseReviewResponse(raw: string): ReviewResponse | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Failed to parse AI response" };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.summary !== "string") {
    return { error: "Invalid AI response: missing summary" };
  }
  if (!Array.isArray(obj.hypotheses)) {
    return { error: "Invalid AI response: missing hypotheses array" };
  }

  const hypotheses: Hypothesis[] = [];
  for (const h of obj.hypotheses) {
    const hyp = h as Record<string, unknown>;
    if (typeof hyp.trigger_name !== "string") return { error: "Invalid hypothesis: missing trigger_name" };
    if (typeof hyp.confidence_score !== "number" || hyp.confidence_score < 0 || hyp.confidence_score > 0.95) {
      return { error: "Invalid hypothesis: confidence_score must be 0.00-0.95" };
    }
    if (!VALID_LABELS.has(hyp.confidence_label as string)) {
      return { error: "Invalid hypothesis: invalid confidence_label" };
    }
    if (!VALID_DIRECTIONS.has(hyp.direction as string)) {
      return { error: "Invalid hypothesis: invalid direction" };
    }

    hypotheses.push({
      trigger_name: hyp.trigger_name as string,
      fodmap_category: (hyp.fodmap_category as string) || "none",
      confidence_score: hyp.confidence_score as number,
      confidence_label: hyp.confidence_label as Hypothesis["confidence_label"],
      direction: hyp.direction as Hypothesis["direction"],
      symptom_pattern: (hyp.symptom_pattern as string) || "",
      supporting_events: typeof hyp.supporting_events === "number" ? hyp.supporting_events : 0,
      contradicting_events: typeof hyp.contradicting_events === "number" ? hyp.contradicting_events : 0,
      notes: typeof hyp.notes === "string" ? hyp.notes : undefined,
    });
  }

  return {
    summary: obj.summary as string,
    days_analysed: 0, // filled by route handler
    entries_analysed: 0, // filled by route handler
    hypotheses,
  };
}
