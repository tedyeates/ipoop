/**
 * Route handler tests for /api/symptoms.
 * Real local SQLite, no mocks. Fresh DB per test.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resetDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import { handleSymptoms } from "../../routes/symptoms.ts";
import { getSymptoms } from "../../db/queries.ts";

let testCounter = 0;

function setupTestDb(): string {
  testCounter++;
  const path = `data/test_symptoms_route_${testCounter}_${Date.now()}.db`;
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
  return new Request("http://localhost/api/symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(params?: string): Request {
  const url = params ? `http://localhost/api/symptoms?${params}` : "http://localhost/api/symptoms";
  return new Request(url, { method: "GET" });
}

const VALID_SYMPTOM = {
  bloating: 5,
  cramping: 3,
  nausea: 2,
  urgency: 7,
  fatigue: 4,
  overall: 6,
};

// ─── Valid POST ──────────────────────────────────────────────────────────────

Deno.test("POST /api/symptoms - valid minimal payload → 201", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest(VALID_SYMPTOM));
  assertEquals(res.status, 201);

  const body = await res.json();
  assertEquals(typeof body.id, "string");
  assertEquals(body.id.length, 26);
  assertEquals(typeof body.logged_at, "string");
});

Deno.test("POST /api/symptoms - valid full payload with notes → 201", async () => {
  await freshDb();
  const payload = { ...VALID_SYMPTOM, notes: "After lunch" };

  const res = await handleSymptoms(postRequest(payload));
  assertEquals(res.status, 201);

  const { getDb } = await import("../../db/client.ts");
  const rows = await getSymptoms(undefined, getDb());
  assertEquals(rows.length, 1);
  assertEquals(rows[0].bloating, 5);
  assertEquals(rows[0].cramping, 3);
  assertEquals(rows[0].nausea, 2);
  assertEquals(rows[0].urgency, 7);
  assertEquals(rows[0].fatigue, 4);
  assertEquals(rows[0].overall, 6);
  assertEquals(rows[0].notes, "After lunch");
});

// ─── Missing required fields ─────────────────────────────────────────────────

Deno.test("POST /api/symptoms - empty body → 400 with all 6 field errors", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({}));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(typeof body.fields.bloating, "string");
  assertEquals(typeof body.fields.cramping, "string");
  assertEquals(typeof body.fields.nausea, "string");
  assertEquals(typeof body.fields.urgency, "string");
  assertEquals(typeof body.fields.fatigue, "string");
  assertEquals(typeof body.fields.overall, "string");
});

Deno.test("POST /api/symptoms - missing one field (bloating) → 400", async () => {
  await freshDb();
  const { bloating: _, ...partial } = VALID_SYMPTOM;
  const res = await handleSymptoms(postRequest(partial));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.bloating, "string");
  // Other fields should NOT have errors
  assertEquals(body.fields.cramping, undefined);
});

// ─── Out-of-range values ─────────────────────────────────────────────────────

Deno.test("POST /api/symptoms - bloating -1 → 400", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({ ...VALID_SYMPTOM, bloating: -1 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.bloating, "string");
});

Deno.test("POST /api/symptoms - overall 11 → 400", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({ ...VALID_SYMPTOM, overall: 11 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.overall, "string");
});

Deno.test("POST /api/symptoms - non-integer value → 400", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({ ...VALID_SYMPTOM, nausea: 3.5 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.nausea, "string");
});

// ─── Boundary valid values ───────────────────────────────────────────────────

Deno.test("POST /api/symptoms - all zeros → 201", async () => {
  await freshDb();
  const payload = {
    bloating: 0,
    cramping: 0,
    nausea: 0,
    urgency: 0,
    fatigue: 0,
    overall: 0,
  };
  const res = await handleSymptoms(postRequest(payload));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/symptoms - all tens → 201", async () => {
  await freshDb();
  const payload = {
    bloating: 10,
    cramping: 10,
    nausea: 10,
    urgency: 10,
    fatigue: 10,
    overall: 10,
  };
  const res = await handleSymptoms(postRequest(payload));
  assertEquals(res.status, 201);
});

// ─── Notes boundary ──────────────────────────────────────────────────────────

Deno.test("POST /api/symptoms - notes over 1000 chars → 400", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({ ...VALID_SYMPTOM, notes: "x".repeat(1001) }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.notes, "string");
});

Deno.test("POST /api/symptoms - notes exactly 1000 chars → 201", async () => {
  await freshDb();
  const res = await handleSymptoms(postRequest({ ...VALID_SYMPTOM, notes: "x".repeat(1000) }));
  assertEquals(res.status, 201);
});

// ─── Method not allowed ──────────────────────────────────────────────────────

Deno.test("PUT /api/symptoms → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/symptoms", { method: "PUT" });
  const res = await handleSymptoms(req);
  assertEquals(res.status, 405);

  const body = await res.json();
  assertEquals(body.error, "METHOD_NOT_ALLOWED");
});

Deno.test("DELETE /api/symptoms → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/symptoms", { method: "DELETE" });
  const res = await handleSymptoms(req);
  assertEquals(res.status, 405);
});

// ─── Invalid JSON ────────────────────────────────────────────────────────────

Deno.test("POST /api/symptoms - invalid JSON body → 400", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json!!!",
  });
  const res = await handleSymptoms(req);
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(body.fields._form, "Request body must be valid JSON");
});

// ─── GET ─────────────────────────────────────────────────────────────────────

Deno.test("GET /api/symptoms - returns empty array when no data", async () => {
  await freshDb();
  const res = await handleSymptoms(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body, []);
});

Deno.test("GET /api/symptoms - returns persisted symptoms", async () => {
  await freshDb();
  await handleSymptoms(postRequest(VALID_SYMPTOM));
  await handleSymptoms(postRequest({ ...VALID_SYMPTOM, overall: 9 }));

  const res = await handleSymptoms(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.length, 2);
});
