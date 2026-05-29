/**
 * Hypotheses route handler.
 * GET /api/hypotheses — retrieve stored hypothesis data.
 */

import { getHypothesis } from "../db/queries.ts";
import { methodNotAllowed, serverError } from "../lib/errors.ts";
import type { ReviewResponse, Hypothesis } from "./review.ts";

export async function handleHypotheses(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return methodNotAllowed(`Method ${req.method} not allowed on /api/hypotheses`);
  }

  try {
    const row = await getHypothesis();

    if (!row) {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hypotheses: Hypothesis[] = JSON.parse(row.hypotheses_json);

    const result: ReviewResponse = {
      id: row.id,
      reviewed_at: row.reviewed_at,
      summary: row.summary,
      days_analysed: row.days_analysed,
      entries_analysed: row.entries_analysed,
      hypotheses,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to get hypotheses:", err);
    return serverError();
  }
}
