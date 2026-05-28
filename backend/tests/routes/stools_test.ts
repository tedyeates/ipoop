/**
 * Route handler tests for /api/stools.
 * Real local SQLite, no mocks. Fresh DB per test.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resetDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import { handleStools } from "../../routes/stools.ts";
import { getStools } from "../../db/queries.ts";

let testCounter = 0;

function setupTestDb(): string {
  testCounter++;
  const path = `data/test_stools_route_${testCounter}_${Date.now()}.db`;
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
  return new Request("http://localhost/api/stools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(params?: string): Request {
  const url = params ? `http://localhost/api/stools?${params}` : "http://localhost/api/stools";
  return new Request(url, { method: "GET" });
}

// ─── Valid POST ──────────────────────────────────────────────────────────────

Deno.test("POST /api/stools - valid minimal payload → 201", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4 }));
  assertEquals(res.status, 201);

  const body = await res.json();
  assertEquals(typeof body.id, "string");
  assertEquals(body.id.length, 26);
  assertEquals(typeof body.logged_at, "string");
});

Deno.test("POST /api/stools - valid full payload → 201 with all fields persisted", async () => {
  await freshDb();
  const payload = {
    bristol_type: 6,
    frequency: 3,
    urgency: 1,
    pain_score: 7,
    blood: 0,
    notes: "Rough morning",
  };

  const res = await handleStools(postRequest(payload));
  assertEquals(res.status, 201);

  const { getDb } = await import("../../db/client.ts");
  const rows = await getStools(undefined, getDb());
  assertEquals(rows.length, 1);
  assertEquals(rows[0].bristol_type, 6);
  assertEquals(rows[0].frequency, 3);
  assertEquals(rows[0].urgency, 1);
  assertEquals(rows[0].pain_score, 7);
  assertEquals(rows[0].blood, 0);
  assertEquals(rows[0].notes, "Rough morning");
});

// ─── Missing required fields ─────────────────────────────────────────────────

Deno.test("POST /api/stools - missing bristol_type → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({}));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(typeof body.fields.bristol_type, "string");
});

// ─── Out-of-range values ─────────────────────────────────────────────────────

Deno.test("POST /api/stools - bristol_type 0 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 0 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.bristol_type, "string");
});

Deno.test("POST /api/stools - bristol_type 8 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 8 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.bristol_type, "string");
});

Deno.test("POST /api/stools - bristol_type 1 (boundary min) → 201", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 1 }));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/stools - bristol_type 7 (boundary max) → 201", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 7 }));
  assertEquals(res.status, 201);
});

Deno.test("POST /api/stools - pain_score 11 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, pain_score: 11 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.pain_score, "string");
});

Deno.test("POST /api/stools - pain_score -1 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, pain_score: -1 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.pain_score, "string");
});

Deno.test("POST /api/stools - frequency 0 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, frequency: 0 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.frequency, "string");
});

Deno.test("POST /api/stools - frequency 21 → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, frequency: 21 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.frequency, "string");
});

// ─── Invalid boolean values ──────────────────────────────────────────────────

Deno.test("POST /api/stools - urgency invalid value → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, urgency: 5 }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.urgency, "string");
});

Deno.test("POST /api/stools - blood invalid value → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, blood: "yes" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.blood, "string");
});

// ─── Boundary: notes max length ──────────────────────────────────────────────

Deno.test("POST /api/stools - notes over 1000 chars → 400", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, notes: "x".repeat(1001) }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.notes, "string");
});

Deno.test("POST /api/stools - notes exactly 1000 chars → 201", async () => {
  await freshDb();
  const res = await handleStools(postRequest({ bristol_type: 4, notes: "x".repeat(1000) }));
  assertEquals(res.status, 201);
});

// ─── Method not allowed ──────────────────────────────────────────────────────

Deno.test("PUT /api/stools → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/stools", { method: "PUT" });
  const res = await handleStools(req);
  assertEquals(res.status, 405);

  const body = await res.json();
  assertEquals(body.error, "METHOD_NOT_ALLOWED");
});

Deno.test("PATCH /api/stools → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/stools", { method: "PATCH" });
  const res = await handleStools(req);
  assertEquals(res.status, 405);
});

// ─── Invalid JSON ────────────────────────────────────────────────────────────

Deno.test("POST /api/stools - invalid JSON body → 400", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/stools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{broken",
  });
  const res = await handleStools(req);
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(body.fields._form, "Request body must be valid JSON");
});

// ─── GET ─────────────────────────────────────────────────────────────────────

Deno.test("GET /api/stools - returns empty array when no data", async () => {
  await freshDb();
  const res = await handleStools(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body, []);
});

Deno.test("GET /api/stools - returns persisted stools", async () => {
  await freshDb();
  await handleStools(postRequest({ bristol_type: 3 }));
  await handleStools(postRequest({ bristol_type: 5 }));

  const res = await handleStools(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.length, 2);
});
