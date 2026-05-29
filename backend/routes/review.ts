/**
 * AI Review route handler.
 * POST /api/review — trigger AI hypothesis generation from logged data.
 */

import { getAiClient, REVIEW_TIMEOUT_MS } from "../ai/client.ts";
import {
  getMeals,
  getStools,
  getContext,
  getSymptoms,
  upsertHypothesis,
  type MealRow,
  type StoolRow,
  type ContextRow,
  type SymptomRow,
} from "../db/queries.ts";
import { generateUlid, nowISO } from "../lib/ulid.ts";
import {
  methodNotAllowed,
  serverError,
  serviceUnavailable,
  timeoutError,
} from "../lib/errors.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  id: string;
  reviewed_at: string;
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses: Hypothesis[];
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function handleReview(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return methodNotAllowed(`Method ${req.method} not allowed on /api/review`);
  }

  // Calculate 90-day window
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all logs from last 90 days
  let meals: MealRow[];
  let stools: StoolRow[];
  let contextLogs: ContextRow[];
  let symptoms: SymptomRow[];

  try {
    [meals, stools, contextLogs, symptoms] = await Promise.all([
      getMeals({ since }),
      getStools({ since }),
      getContext({ since }),
      getSymptoms({ since }),
    ]);
  } catch (err) {
    console.error("Failed to fetch logs for review:", err);
    return serverError();
  }

  const totalEntries = meals.length + stools.length + contextLogs.length + symptoms.length;

  // Calculate days with data
  const allDates = new Set<string>();
  for (const m of meals) allDates.add(m.logged_at.slice(0, 10));
  for (const s of stools) allDates.add(s.logged_at.slice(0, 10));
  for (const c of contextLogs) allDates.add(c.logged_at.slice(0, 10));
  for (const s of symptoms) allDates.add(s.logged_at.slice(0, 10));
  const daysWithData = allDates.size;

  // Assemble prompt
  const prompt = buildReviewPrompt(meals, stools, contextLogs, symptoms, daysWithData);

  // Call Claude
  let aiResponseText: string;
  try {
    const client = getAiClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }, { timeout: REVIEW_TIMEOUT_MS });

    // Extract text from response
    const textBlock = response.content.find(
      (block: { type: string }) => block.type === "text",
    );
    if (!textBlock || textBlock.type !== "text") {
      console.error("No text block in Claude response");
      return serviceUnavailable("AI returned an unexpected response format");
    }
    aiResponseText = (textBlock as { type: "text"; text: string }).text;
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; name?: string };
    console.error("Claude API error:", error.message ?? err);

    // Timeout detection
    if (
      error.name === "APIConnectionTimeoutError" ||
      error.name === "TimeoutError" ||
      (error.message && error.message.toLowerCase().includes("timeout"))
    ) {
      return timeoutError("AI review timed out. Please try again.");
    }

    // Any other failure
    return serviceUnavailable("AI service is temporarily unavailable. Please try again later.");
  }

  // Parse Claude response
  let parsed: { summary: string; hypotheses: Hypothesis[] };
  try {
    parsed = parseReviewResponse(aiResponseText);
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    return serviceUnavailable("AI returned an invalid response. Please try again.");
  }

  // Persist: DELETE existing, INSERT new
  const id = generateUlid();
  const reviewed_at = nowISO();

  try {
    await upsertHypothesis({
      id,
      reviewed_at,
      summary: parsed.summary,
      days_analysed: daysWithData,
      entries_analysed: totalEntries,
      hypotheses_json: JSON.stringify(parsed.hypotheses),
    });
  } catch (err) {
    console.error("Failed to persist hypothesis:", err);
    return serverError();
  }

  const result: ReviewResponse = {
    id,
    reviewed_at,
    summary: parsed.summary,
    days_analysed: daysWithData,
    entries_analysed: totalEntries,
    hypotheses: parsed.hypotheses,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Prompt Assembly ─────────────────────────────────────────────────────────

function buildReviewPrompt(
  meals: MealRow[],
  stools: StoolRow[],
  contextLogs: ContextRow[],
  symptoms: SymptomRow[],
  daysWithData: number,
): string {
  const mealSummary = meals.map((m) =>
    `- [${m.logged_at}] ${m.meal_type ?? "meal"}: ${m.description} | FODMAP: ${m.fodmap_flags} | portion: ${m.portion_size ?? "unknown"} | speed: ${m.eating_speed ?? "unknown"}`
  ).join("\n");

  const stoolSummary = stools.map((s) =>
    `- [${s.logged_at}] Bristol ${s.bristol_type} | pain: ${s.pain_score ?? "n/a"} | urgency: ${s.urgency ?? "n/a"} | blood: ${s.blood ?? "n/a"}`
  ).join("\n");

  const contextSummary = contextLogs.map((c) =>
    `- [${c.logged_at}] stress: ${c.stress_score ?? "n/a"} | sleep: ${c.sleep_hours ?? "n/a"}h quality ${c.sleep_quality ?? "n/a"} | water: ${c.water_litres ?? "n/a"}L | exercise: ${c.exercise_type ?? "none"} ${c.exercise_duration ?? 0}min | caffeine: ${c.caffeine_mg ?? "n/a"}mg | alcohol: ${c.alcohol_units ?? "n/a"}u`
  ).join("\n");

  const symptomSummary = symptoms.map((s) =>
    `- [${s.logged_at}] bloating: ${s.bloating} | cramping: ${s.cramping} | nausea: ${s.nausea} | urgency: ${s.urgency} | fatigue: ${s.fatigue} | overall: ${s.overall}`
  ).join("\n");

  return `You are an IBS trigger analysis engine. Analyse the following food diary and health log data to identify probable IBS triggers.

DATA WINDOW: ${daysWithData} days of data available.

MEAL LOGS:
${mealSummary || "(no meals logged)"}

STOOL LOGS:
${stoolSummary || "(no stool logs)"}

CONTEXT LOGS:
${contextSummary || "(no context logs)"}

SYMPTOM LOGS:
${symptomSummary || "(no symptom logs)"}

ANALYSIS RULES:
1. Correlate meals with symptoms occurring 6-24 hours later (transit window).
2. A symptom event is any symptom dimension scoring 4 or above.
3. Consider confounders: stress >= 7, sleep quality <= 2, water < 1.0L. Reduce confidence by at least 0.15 when confounders are present on the same symptom day.
4. Consider FODMAP dose-dependency: small portions may be tolerated while large portions cause symptoms.
5. Consider cumulative FODMAP load: multiple moderate-FODMAP items in one meal may exceed tolerance.
6. Confidence score range: 0.00-0.95.
7. Confidence labels: Low (0.00-0.39), Moderate (0.40-0.64), High (0.65-0.84), Very High (0.85-0.95).
8. Require minimum 3 supporting events before confidence can exceed 0.50.
9. If fewer than 7 days of data: all confidence must be Low (max 0.39).
10. If fewer than 14 days of data: cap confidence at Moderate (max 0.64).

RESPOND WITH ONLY valid JSON in this exact format (no markdown, no explanation outside the JSON):
{
  "summary": "A plain-English paragraph summarising the analysis findings.",
  "hypotheses": [
    {
      "trigger_name": "string",
      "fodmap_category": "F|O|D|M|P|none",
      "confidence_score": 0.00,
      "confidence_label": "Low|Moderate|High|Very High",
      "direction": "worsens|improves|unclear",
      "symptom_pattern": "description of symptom pattern",
      "supporting_events": 0,
      "contradicting_events": 0,
      "notes": "optional notes"
    }
  ]
}`;
}

// ─── Response Parsing ────────────────────────────────────────────────────────

export function parseReviewResponse(text: string): { summary: string; hypotheses: Hypothesis[] } {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const data = JSON.parse(cleaned);

  if (typeof data.summary !== "string" || !data.summary) {
    throw new Error("Missing or invalid 'summary' field");
  }

  if (!Array.isArray(data.hypotheses)) {
    throw new Error("Missing or invalid 'hypotheses' array");
  }

  const hypotheses: Hypothesis[] = data.hypotheses.map((h: Record<string, unknown>, i: number) => {
    if (typeof h.trigger_name !== "string") {
      throw new Error(`hypotheses[${i}]: missing trigger_name`);
    }
    if (typeof h.fodmap_category !== "string") {
      throw new Error(`hypotheses[${i}]: missing fodmap_category`);
    }
    if (typeof h.confidence_score !== "number" || h.confidence_score < 0 || h.confidence_score > 0.95) {
      throw new Error(`hypotheses[${i}]: invalid confidence_score`);
    }
    const validLabels = ["Low", "Moderate", "High", "Very High"];
    if (!validLabels.includes(h.confidence_label as string)) {
      throw new Error(`hypotheses[${i}]: invalid confidence_label`);
    }
    const validDirections = ["worsens", "improves", "unclear"];
    if (!validDirections.includes(h.direction as string)) {
      throw new Error(`hypotheses[${i}]: invalid direction`);
    }
    if (typeof h.symptom_pattern !== "string") {
      throw new Error(`hypotheses[${i}]: missing symptom_pattern`);
    }
    if (typeof h.supporting_events !== "number") {
      throw new Error(`hypotheses[${i}]: missing supporting_events`);
    }
    if (typeof h.contradicting_events !== "number") {
      throw new Error(`hypotheses[${i}]: missing contradicting_events`);
    }

    return {
      trigger_name: h.trigger_name as string,
      fodmap_category: h.fodmap_category as string,
      confidence_score: h.confidence_score as number,
      confidence_label: h.confidence_label as Hypothesis["confidence_label"],
      direction: h.direction as Hypothesis["direction"],
      symptom_pattern: h.symptom_pattern as string,
      supporting_events: h.supporting_events as number,
      contradicting_events: h.contradicting_events as number,
      notes: typeof h.notes === "string" ? h.notes : undefined,
    };
  });

  return { summary: data.summary, hypotheses };
}
