/**
 * Route handler tests for /api/meals.
 * Real local SQLite, no mocks. Fresh DB per test.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resetDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import { handleMeals } from "../../routes/meals.ts";
import { getMeals } from "../../db/queries.ts";

let testCounter = 0;

function setupTestDb(): string {
  testCounter++;
  const path = `data/test_meals_route_${testCounter}_${Date.now()}.db`;
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
  return new Request("http://localhost/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(params?: string): Request {
  const url = params ? `http://localhost/api/meals?${params}` : "http://localhost/api/meals";
  return new Request(url, { method: "GET" });
}

// ─── Valid POST ──────────────────────────────────────────────────────────────

Deno.test("POST /api/meals - valid minimal payload → 201", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "Toast with butter" }));
  assertEquals(res.status, 201);

  const body = await res.json();
  assertEquals(typeof body.id, "string");
  assertEquals(body.id.length, 26); // ULID
  assertEquals(typeof body.logged_at, "string");
});

Deno.test("POST /api/meals - valid full payload → 201 with all fields persisted", async () => {
  await freshDb();
  const payload = {
    description: "Big salad with chickpeas",
    meal_type: "lunch",
    fodmap_flags: "FO",
    portion_size: "large",
    eating_speed: "slow",
  };

  const res = await handleMeals(postRequest(payload));
  assertEquals(res.status, 201);

  const { getDb } = await import("../../db/client.ts");
  const rows = await getMeals(undefined, getDb());
  assertEquals(rows.length, 1);
  assertEquals(rows[0].description, "Big salad with chickpeas");
  assertEquals(rows[0].meal_type, "lunch");
  assertEquals(rows[0].portion_size, "large");
  assertEquals(rows[0].eating_speed, "slow");
});

// ─── Missing required fields ─────────────────────────────────────────────────

Deno.test("POST /api/meals - missing description → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({}));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(typeof body.fields.description, "string");
});

Deno.test("POST /api/meals - empty description → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.fields.description, "Required");
});

Deno.test("POST /api/meals - whitespace-only description → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "   " }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.fields.description, "Required");
});

// ─── Out-of-range / boundary values ─────────────────────────────────────────

Deno.test("POST /api/meals - description over 500 chars → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "x".repeat(501) }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.fields.description, "Must be 500 characters or less");
});

Deno.test("POST /api/meals - description exactly 500 chars → 201", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "x".repeat(500) }));
  assertEquals(res.status, 201);
});

// ─── Invalid enum values ─────────────────────────────────────────────────────

Deno.test("POST /api/meals - invalid meal_type → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "Food", meal_type: "brunch" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.meal_type, "string");
});

Deno.test("POST /api/meals - invalid portion_size → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "Food", portion_size: "huge" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.portion_size, "string");
});

Deno.test("POST /api/meals - invalid eating_speed → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "Food", eating_speed: "turbo" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.eating_speed, "string");
});

Deno.test("POST /api/meals - invalid fodmap_flags → 400", async () => {
  await freshDb();
  const res = await handleMeals(postRequest({ description: "Food", fodmap_flags: "XYZ" }));
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(typeof body.fields.fodmap_flags, "string");
});

// ─── Method not allowed ──────────────────────────────────────────────────────

Deno.test("PUT /api/meals → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/meals", { method: "PUT" });
  const res = await handleMeals(req);
  assertEquals(res.status, 405);

  const body = await res.json();
  assertEquals(body.error, "METHOD_NOT_ALLOWED");
});

Deno.test("DELETE /api/meals → 405", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/meals", { method: "DELETE" });
  const res = await handleMeals(req);
  assertEquals(res.status, 405);
});

// ─── Invalid JSON ────────────────────────────────────────────────────────────

Deno.test("POST /api/meals - invalid JSON body → 400 VALIDATION_ERROR", async () => {
  await freshDb();
  const req = new Request("http://localhost/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json{{{",
  });
  const res = await handleMeals(req);
  assertEquals(res.status, 400);

  const body = await res.json();
  assertEquals(body.error, "VALIDATION_ERROR");
  assertEquals(body.fields._form, "Request body must be valid JSON");
});

// ─── GET ─────────────────────────────────────────────────────────────────────

Deno.test("GET /api/meals - returns empty array when no data", async () => {
  await freshDb();
  const res = await handleMeals(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body, []);
});

Deno.test("GET /api/meals - returns persisted meals", async () => {
  await freshDb();
  // Insert via POST
  await handleMeals(postRequest({ description: "Meal one" }));
  await handleMeals(postRequest({ description: "Meal two" }));

  const res = await handleMeals(getRequest());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.length, 2);
});
