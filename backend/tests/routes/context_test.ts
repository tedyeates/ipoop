/**
 * Route handler tests for /api/context.
 * Real local SQLite, no mocks. Fresh DB per test.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resetDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import { handleContext } from "../../routes/context.ts";
import { getContext } from "../../db/queries.ts";

let testCounter = 0;

function setupTestDb(): string {
  testCounter++;
  const path = `data/test_context_route_${testCounter}_${Date.now()}.db`;
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

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(params?: string): Request {
  const url = params ? `http://localhost/api/context?${params}` : "http://localhost/api/context";
  return new Request(url, { method: "GET" });
}

// ─── Valid POST ──────────────────────────────────────────────────────────────

Deno.test("POST /api/context - valid single field → 201", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ stress_score: 5 }));
  assertEquals(res.status, 201);

  const body = await res.json();
  assertEquals(typeof body.id, "string");
  assertEquals(body.id.length, 26);
  assertEquals(typeof body.logged_at, "string");
});

Deno.test("POST /api/context - valid full payload → 201 with all fields persisted", async () => {
  await freshDb();
  const payload = {
    stress_score: 7,
    sleep_hours: 6.5,
    sleep_quality: 3,
    water_litres: 2.0,
    exercise_type: "gym",
    exercise_duration: 45,
    caffeine_mg: 200,
    alcohol_units: 1.5,
    medications: "Ibuprofen",
    menstrual_phase: "luteal",
    notes: "Stressful day",
  };

  const res = await handleContext(postRequest(payload));
  assertEquals(res.status, 201);

  const { getDb } = await import("../../db/client.ts");
  const rows = await getContext(undefined, getDb());
  assertEquals(rows.length, 1);
  assertEquals(rows[0].stress_score, 7);
  assertEquals(rows[0].sleep_hours, 6.5);
  assertEquals(rows[0].sleep_quality, 3);
  assertEquals(rows[0].water_litres, 2.0);
  assertEquals(rows[0].exercise_type, "gym");
  assertEquals(rows[0].exercise_duration, 45);
  assertEquals(rows[0].caffeine_mg, 200);
  assertEquals(rows[0].alcohol_units, 1.5);
  assertEquals(rows[0].medications, "Ibuprofen");
  assertEquals(rows[0].menstrual_phase, "luteal");
  assertEquals(rows[0].notes, "Stressful day");
});

// ─── At least one field required ─────────────────────────────────────────────

Deno.test("POST /api/context - empty body → 400 (at least one field required)", async () => {
  await freshDb();
  const res = await handleContext(postRequest({}));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(body.fields._form, "At least one field is required");
});

// ─── Out-of-range values ─────────────────────────────────────────────────────

Deno.test("POST /api/context - stress_score 0 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ stress_score: 0 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.stress_score, "string");
});

Deno.test("POST /api/context - stress_score 11 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ stress_score: 11 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.stress_score, "string");
});

Deno.test("POST /api/context - sleep_quality 0 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ sleep_quality: 0 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.sleep_quality, "string");
});

Deno.test("POST /api/context - sleep_quality 6 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ sleep_quality: 6 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.sleep_quality, "string");
});

Deno.test("POST /api/context - sleep_hours -1 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ sleep_hours: -1 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.sleep_hours, "string");
});

Deno.test("POST /api/context - sleep_hours 25 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ sleep_hours: 25 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.sleep_hours, "string");
});

Deno.test("POST /api/context - water_litres -0.1 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ water_litres: -0.1 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.water_litres, "string");
});

Deno.test("POST /api/context - exercise_duration -1 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ exercise_duration: -1 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.exercise_duration, "string");
});

Deno.test("POST /api/context - exercise_duration 1441 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ exercise_duration: 1441 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.exercise_duration, "string");
});

Deno.test("POST /api/context - caffeine_mg 2001 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ caffeine_mg: 2001 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.caffeine_mg, "string");
});

Deno.test("POST /api/context - alcohol_units 51 → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ alcohol_units: 51 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.alcohol_units, "string");
});

// ─── Boundary valid values ───────────────────────────────────────────────────

Deno.test("POST /api/context - stress_score 1 (min) → 201", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ stress_score: 1 }));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/context - stress_score 10 (max) → 201", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ stress_score: 10 }));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/context - exercise_duration 0 (min) → 201", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ exercise_duration: 0 }));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/context - exercise_duration 1440 (max) → 201", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ exercise_duration: 1440 }));
  assertEquals(res.status, 201);
});

// ─── Invalid enum values ─────────────────────────────────────────────────────

Deno.test("POST /api/context - invalid exercise_type → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ exercise_type: "swimming" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.exercise_type, "string");
});

Deno.test("POST /api/context - invalid menstrual_phase → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ menstrual_phase: "unknown" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.menstrual_phase, "string");
});

// ─── String length boundaries ────────────────────────────────────────────────

Deno.test("POST /api/context - medications over 500 chars → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ medications: "x".repeat(501) }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.medications, "string");
});

Deno.test("POST /api/context - notes over 1000 chars → 400", async () => {
  await freshDb();
  const res = await handleContext(postRequest({ notes: "x".repeat(1001) }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.notes, "string");
});

// ─── Method not allowed ──────────────────────────────────────────────────────

Deno.test("PUT /api/context → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/context", { method: "PUT" });
  const res = await handleContext(req);
  assertEquals(res.status, 405);

  const body = await res.json();
  assertEquals(body.error, "METHOD_NOT_ALLOWED");
});

Deno.test("DELETE /api/context → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/context", { method: "DELETE" });
  const res = await handleContext(req);
  assertEquals(res.status, 405);
});

// ─── Invalid JSON ────────────────────────────────────────────────────────────

Deno.test("POST /api/context - invalid JSON body → 400", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{{invalid",
  });
  const res = await handleContext(req);
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(body.fields._form, "Request body must be valid JSON");
});

// ─── GET ─────────────────────────────────────────────────────────────────────

Deno.test("GET /api/context - returns empty array when no data", async () => {
  await freshDb();
  const res = await handleContext(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body, []);
});

Deno.test("GET /api/context - returns persisted entries", async () => {
  await freshDb();
  await handleContext(postRequest({ stress_score: 3 }));
  await handleContext(postRequest({ sleep_hours: 8 }));

  const res = await handleContext(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.length, 2);
});
