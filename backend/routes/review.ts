import { createErrorResponse } from "../lib/errors.ts";
import { generateUlid, generateTimestamp } from "../lib/ulid.ts";
import anthropic, { REVIEW_TIMEOUT_MS } from "../ai/client.ts";
import { buildReviewPrompt, parseReviewResponse } from "../ai/review-prompt.ts";
import { getMealLogs, getStoolLogs, getContextLogs, getSymptomLogs, upsertHypothesis } from "../db/queries.ts";

export async function handleReview(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return createErrorResponse("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  }

  try {
    // Query all logs up to 90 days
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const [meals, stools, contexts, symptoms] = await Promise.all([
      getMealLogs(since),
      getStoolLogs(since),
      getContextLogs(since),
      getSymptomLogs(since),
    ]);

    const totalEntries = meals.length + stools.length + contexts.length + symptoms.length;
    if (totalEntries === 0) {
      return createErrorResponse("INSUFFICIENT_DATA", "No log data available for analysis", 400);
    }

    // Calculate days of data
    const allTimestamps = [
      ...meals.map((m) => m.logged_at),
      ...stools.map((s) => s.logged_at),
      ...contexts.map((c) => c.logged_at),
      ...symptoms.map((s) => s.logged_at),
    ].map((t) => new Date(t).getTime());
    const earliest = Math.min(...allTimestamps);
    const latest = Math.max(...allTimestamps);
    const daysOfData = Math.max(1, Math.ceil((latest - earliest) / (24 * 60 * 60 * 1000)));

    const prompt = buildReviewPrompt(meals, stools, contexts, symptoms, daysOfData);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS);

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("AI_ERROR", "No text response from AI", 503);
    }

    const result = parseReviewResponse(textBlock.text);
    if ("error" in result) {
      return createErrorResponse("AI_ERROR", result.error, 503);
    }

    // Fill in metadata
    result.days_analysed = daysOfData;
    result.entries_analysed = totalEntries;

    // Persist: overwrite existing hypothesis
    const id = generateUlid();
    const reviewed_at = generateTimestamp();
    await upsertHypothesis({
      id,
      reviewed_at,
      summary: result.summary,
      days_analysed: result.days_analysed,
      entries_analysed: result.entries_analysed,
      hypotheses_json: JSON.stringify(result.hypotheses),
    });

    return new Response(JSON.stringify({ id, reviewed_at, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return createErrorResponse("TIMEOUT", "AI review timed out. Please try again.", 504);
    }
    return createErrorResponse("SERVICE_UNAVAILABLE", "Review service is temporarily unavailable", 503);
  }
}
