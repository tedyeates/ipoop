/**
 * Data export route handler.
 * GET /api/export?format=json|csv — export all data.
 */

import {
  getMeals,
  getStools,
  getContext,
  getSymptoms,
  getHypothesis,
} from "../db/queries.ts";
import { methodNotAllowed, serverError } from "../lib/errors.ts";

/** Generate export filename: ipoop-export-{format}-{YYYY-MM-DD} */
function exportFilename(format: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `ipoop-export-${format}-${yyyy}-${mm}-${dd}`;
}

/** Escape a CSV field value. */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert rows to CSV string with header. */
function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => csvEscape(row[col])).join(",")
  );
  return [header, ...dataRows].join("\n");
}

export async function handleExport(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return methodNotAllowed(`Method ${req.method} not allowed on /api/export`);
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";

  if (format !== "json" && format !== "csv") {
    return new Response(
      JSON.stringify({ error: "VALIDATION_ERROR", message: "format must be 'json' or 'csv'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const [meals, stools, context, symptoms, hypothesis] = await Promise.all([
      getMeals(),
      getStools(),
      getContext(),
      getSymptoms(),
      getHypothesis(),
    ]);

    const hypotheses = hypothesis ? [hypothesis] : [];
    const filename = exportFilename(format);

    if (format === "json") {
      const data = {
        meal_logs: meals,
        stool_logs: stools,
        context_logs: context,
        symptom_logs: symptoms,
        hypotheses,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    // CSV format — produce one file per table in a JSON envelope
    const mealCols = ["id", "logged_at", "meal_type", "description", "fodmap_flags", "ingredients", "fodmap_detail", "portion_size", "eating_speed", "scan_used"];
    const stoolCols = ["id", "logged_at", "bristol_type", "frequency", "urgency", "pain_score", "blood", "notes"];
    const contextCols = ["id", "logged_at", "stress_score", "sleep_hours", "sleep_quality", "water_litres", "exercise_type", "exercise_duration", "caffeine_mg", "alcohol_units", "medications", "menstrual_phase", "notes"];
    const symptomCols = ["id", "logged_at", "bloating", "cramping", "nausea", "urgency", "fatigue", "overall", "notes"];
    const hypothesisCols = ["id", "reviewed_at", "summary", "days_analysed", "entries_analysed", "hypotheses_json"];

    const csvFiles: Record<string, string> = {
      [`${filename}-meal_logs.csv`]: toCsv(mealCols, meals as unknown as Record<string, unknown>[]),
      [`${filename}-stool_logs.csv`]: toCsv(stoolCols, stools as unknown as Record<string, unknown>[]),
      [`${filename}-context_logs.csv`]: toCsv(contextCols, context as unknown as Record<string, unknown>[]),
      [`${filename}-symptom_logs.csv`]: toCsv(symptomCols, symptoms as unknown as Record<string, unknown>[]),
      [`${filename}-hypotheses.csv`]: toCsv(hypothesisCols, hypotheses as unknown as Record<string, unknown>[]),
    };

    return new Response(JSON.stringify(csvFiles), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return serverError();
  }
}
