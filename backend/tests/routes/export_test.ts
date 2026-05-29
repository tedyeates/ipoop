/**
 * Route handler tests for /api/export and /api/hypotheses.
 * Real local SQLite, no mocks. Fresh DB per test.
 */

import { assertEquals, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resetDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import { handleExport } from "../../routes/export.ts";
import { handleHypotheses } from "../../routes/hypotheses.ts";
import {
  insertMeal,
  insertStool,
  insertContext,
  insertSymptom,
  upsertHypothesis,
} from "../../db/queries.ts";

let testCounter = 0;

function setupTestDb(): string {
  testCounter++;
  const path = `data/test_export_${testCounter}_${Date.now()}.db`;
  Deno.env.set("LOCAL_DB_PATH", path);
  resetDb();
  return path;
}

async function freshDb(): Promise<void> {
  setupTestDb();
  const { getDb } = await import("../../db/client.ts");
  const db = getDb();
  await applySchema(db);
}

function exportRequest(format: string): Request {
  return new Request(`http://localhost/api/export?format=${format}`, { method: "GET" });
}

function hypothesesRequest(): Request {
  return new Request("http://localhost/api/hypotheses", { method: "GET" });
}

// ─── Seed helpers ────────────────────────────────────────────────────────────

async function seedAllTables(): Promise<void> {
  const { getDb } = await import("../../db/client.ts");
  const db = getDb();

  await insertMeal({
    id: "01HQXYZ1234567890ABCDE",
    logged_at: "2024-03-15T08:30:00.000Z",
    meal_type: "breakfast",
    description: "Oatmeal with berries",
    fodmap_flags: '["F","O"]',
    portion_size: "medium",
    eating_speed: "normal",
  }, db);

  await insertStool({
    id: "01HQXYZ1234567890ABCDF",
    logged_at: "2024-03-15T10:00:00.000Z",
    bristol_type: 4,
    pain_score: 2,
    notes: "Normal",
  }, db);

  await insertContext({
    id: "01HQXYZ1234567890ABCDG",
    logged_at: "2024-03-15T07:00:00.000Z",
    stress_score: 3,
    sleep_hours: 7.5,
    sleep_quality: 4,
    water_litres: 2.0,
  }, db);

  await insertSymptom({
    id: "01HQXYZ1234567890ABCDH",
    logged_at: "2024-03-15T20:00:00.000Z",
    bloating: 2,
    cramping: 1,
    nausea: 0,
    urgency: 1,
    fatigue: 3,
    overall: 2,
  }, db);

  await upsertHypothesis({
    id: "01HQXYZ1234567890ABCDI",
    reviewed_at: "2024-03-15T21:00:00.000Z",
    summary: "Oats may be a trigger.",
    days_analysed: 14,
    entries_analysed: 42,
    hypotheses_json: JSON.stringify([{
      trigger_name: "Oats",
      fodmap_category: "F",
      confidence_score: 0.55,
      confidence_label: "Moderate",
      direction: "worsens",
      symptom_pattern: "Bloating 6-12h after",
      supporting_events: 5,
      contradicting_events: 1,
    }]),
  }, db);
}

// ─── JSON Export ─────────────────────────────────────────────────────────────

Deno.test("GET /api/export?format=json - with data in all tables → correct structure", async () => {
  await freshDb();
  await seedAllTables();

  const res = await handleExport(exportRequest("json"));
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(Array.isArray(body.meal_logs), true);
  assertEquals(Array.isArray(body.stool_logs), true);
  assertEquals(Array.isArray(body.context_logs), true);
  assertEquals(Array.isArray(body.symptom_logs), true);
  assertEquals(Array.isArray(body.hypotheses), true);

  assertEquals(body.meal_logs.length, 1);
  assertEquals(body.stool_logs.length, 1);
  assertEquals(body.context_logs.length, 1);
  assertEquals(body.symptom_logs.length, 1);
  assertEquals(body.hypotheses.length, 1);

  // Verify meal fields preserved
  assertEquals(body.meal_logs[0].description, "Oatmeal with berries");
  assertEquals(body.meal_logs[0].meal_type, "breakfast");

  // Verify stool fields preserved
  assertEquals(body.stool_logs[0].bristol_type, 4);
  assertEquals(body.stool_logs[0].pain_score, 2);

  // Verify context fields preserved
  assertEquals(body.context_logs[0].stress_score, 3);
  assertEquals(body.context_logs[0].sleep_hours, 7.5);

  // Verify symptom fields preserved
  assertEquals(body.symptom_logs[0].bloating, 2);
  assertEquals(body.symptom_logs[0].overall, 2);

  // Verify hypothesis fields preserved
  assertEquals(body.hypotheses[0].summary, "Oats may be a trigger.");
  assertEquals(body.hypotheses[0].days_analysed, 14);
});

Deno.test("GET /api/export?format=json - with empty tables → empty arrays", async () => {
  await freshDb();

  const res = await handleExport(exportRequest("json"));
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.meal_logs, []);
  assertEquals(body.stool_logs, []);
  assertEquals(body.context_logs, []);
  assertEquals(body.symptom_logs, []);
  assertEquals(body.hypotheses, []);
});

// ─── CSV Export ──────────────────────────────────────────────────────────────

Deno.test("GET /api/export?format=csv - with data → valid CSV with headers and data rows", async () => {
  await freshDb();
  await seedAllTables();

  const res = await handleExport(exportRequest("csv"));
  assertEquals(res.status, 200);

  const body = await res.json();
  const keys = Object.keys(body);
  assertEquals(keys.length, 5);

  // Check meal CSV
  const mealKey = keys.find((k) => k.includes("meal_logs"));
  const mealCsv = body[mealKey!];
  const mealLines = mealCsv.split("\n");
  assertEquals(mealLines[0], "id,logged_at,meal_type,description,fodmap_flags,ingredients,fodmap_detail,portion_size,eating_speed,scan_used");
  assertEquals(mealLines.length, 2); // header + 1 data row

  // Check stool CSV
  const stoolKey = keys.find((k) => k.includes("stool_logs"));
  const stoolCsv = body[stoolKey!];
  const stoolLines = stoolCsv.split("\n");
  assertEquals(stoolLines[0], "id,logged_at,bristol_type,frequency,urgency,pain_score,blood,notes");
  assertEquals(stoolLines.length, 2);

  // Check context CSV
  const contextKey = keys.find((k) => k.includes("context_logs"));
  const contextCsv = body[contextKey!];
  const contextLines = contextCsv.split("\n");
  assertEquals(contextLines[0], "id,logged_at,stress_score,sleep_hours,sleep_quality,water_litres,exercise_type,exercise_duration,caffeine_mg,alcohol_units,medications,menstrual_phase,notes");
  assertEquals(contextLines.length, 2);

  // Check symptom CSV
  const symptomKey = keys.find((k) => k.includes("symptom_logs"));
  const symptomCsv = body[symptomKey!];
  const symptomLines = symptomCsv.split("\n");
  assertEquals(symptomLines[0], "id,logged_at,bloating,cramping,nausea,urgency,fatigue,overall,notes");
  assertEquals(symptomLines.length, 2);

  // Check hypotheses CSV
  const hypKey = keys.find((k) => k.includes("hypotheses"));
  const hypCsv = body[hypKey!];
  const hypLines = hypCsv.split("\n");
  assertEquals(hypLines[0], "id,reviewed_at,summary,days_analysed,entries_analysed,hypotheses_json");
  assertEquals(hypLines.length, 2);
});

Deno.test("GET /api/export?format=csv - with empty tables → header-only output", async () => {
  await freshDb();

  const res = await handleExport(exportRequest("csv"));
  assertEquals(res.status, 200);

  const body = await res.json();
  const keys = Object.keys(body);

  for (const key of keys) {
    const csv = body[key];
    const lines = csv.split("\n");
    // Should have only the header row
    assertEquals(lines.length, 1);
    // Header should not be empty
    assertEquals(lines[0].length > 0, true);
  }
});

// ─── Export filename pattern ─────────────────────────────────────────────────

Deno.test("GET /api/export - filename matches ipoop-export-{format}-{YYYY-MM-DD} pattern", async () => {
  await freshDb();

  const resJson = await handleExport(exportRequest("json"));
  const dispositionJson = resJson.headers.get("Content-Disposition") ?? "";
  // Consume body to avoid resource leak
  await resJson.text();
  assertMatch(dispositionJson, /ipoop-export-json-\d{4}-\d{2}-\d{2}\.json/);

  const resCsv = await handleExport(exportRequest("csv"));
  const dispositionCsv = resCsv.headers.get("Content-Disposition") ?? "";
  await resCsv.text();
  assertMatch(dispositionCsv, /ipoop-export-csv-\d{4}-\d{2}-\d{2}\.json/);
});

// ─── Export validation ───────────────────────────────────────────────────────

Deno.test("GET /api/export - invalid format → 400", async () => {
  await freshDb();

  const res = await handleExport(exportRequest("xml"));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
});

Deno.test("POST /api/export → 405", async () => {
  await freshDb();

  const req = new Request("http://localhost/api/export?format=json", { method: "POST" });
  const res = await handleExport(req);
  assertEquals(res.status, 405);
});

// ─── Hypotheses GET ──────────────────────────────────────────────────────────

Deno.test("GET /api/hypotheses - with existing record → returns full ReviewResponse shape", async () => {
  await freshDb();
  await seedAllTables();

  const res = await handleHypotheses(hypothesesRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(typeof body.id, "string");
  assertEquals(typeof body.reviewed_at, "string");
  assertEquals(typeof body.summary, "string");
  assertEquals(typeof body.days_analysed, "number");
  assertEquals(typeof body.entries_analysed, "number");
  assertEquals(Array.isArray(body.hypotheses), true);

  // Verify hypothesis content
  assertEquals(body.summary, "Oats may be a trigger.");
  assertEquals(body.days_analysed, 14);
  assertEquals(body.entries_analysed, 42);
  assertEquals(body.hypotheses.length, 1);
  assertEquals(body.hypotheses[0].trigger_name, "Oats");
  assertEquals(body.hypotheses[0].fodmap_category, "F");
  assertEquals(body.hypotheses[0].confidence_score, 0.55);
  assertEquals(body.hypotheses[0].confidence_label, "Moderate");
  assertEquals(body.hypotheses[0].direction, "worsens");
  assertEquals(body.hypotheses[0].supporting_events, 5);
  assertEquals(body.hypotheses[0].contradicting_events, 1);
});

Deno.test("GET /api/hypotheses - with no record → returns null", async () => {
  await freshDb();

  const res = await handleHypotheses(hypothesesRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body, null);
});

Deno.test("PUT /api/hypotheses → 405", async () => {
  await freshDb();

  const req = new Request("http://localhost/api/hypotheses", { method: "PUT" });
  const res = await handleHypotheses(req);
  assertEquals(res.status, 405);
});
