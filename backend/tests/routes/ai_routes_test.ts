/**
 * Route handler tests for POST /api/review.
 * Uses real local SQLite for DB operations, mocks only the Claude API call.
 */

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { setAiClient, resetAiClient } from "../../ai/client.ts";
import { resetDb, createTestDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import {
  insertMeal,
  insertStool,
  insertContext,
  insertSymptom,
  getHypothesis,
  upsertHypothesis,
} from "../../db/queries.ts";
import { handleReview } from "../../routes/review.ts";
import type { Client } from "@libsql/client";


// ─── Mock Anthropic client ───────────────────────────────────────────────────

function createMockClient(response: { text: string } | { error: Error }) {
  return {
    messages: {
      create: (_params: unknown, _opts?: unknown) => {
        if ("error" in response) {
          return Promise.reject(response.error);
        }
        return Promise.resolve({
          content: [{ type: "text", text: response.text }],
        });
      },
    },
  } as unknown as import("@anthropic-ai/sdk").default;
}

// ─── Valid review response JSON ──────────────────────────────────────────────

const VALID_REVIEW_RESPONSE = JSON.stringify({
  summary:
    "Analysis of 14 days of data shows potential lactose sensitivity.",
  hypotheses: [
    {
      trigger_name: "Dairy",
      fodmap_category: "D",
      confidence_score: 0.55,
      confidence_label: "Moderate",
      direction: "worsens",
      symptom_pattern:
        "Bloating and cramping 8-12 hours after dairy consumption",
      supporting_events: 4,
      contradicting_events: 1,
      notes: "Dose-dependent: small amounts tolerated",
    },
  ],
});

// ─── Test DB setup helpers ───────────────────────────────────────────────────

let testCounter = 0;

async function setupTestDb(): Promise<Client> {
  testCounter++;
  const path = `data/test_review_${testCounter}_${Date.now()}.db`;
  // Point the singleton at this temp DB
  Deno.env.set("LOCAL_DB_PATH", path);
  resetDb();
  const client = createTestDb(path);
  await applySchema(client);
  return client;
}

function cleanupTest(): void {
  resetAiClient();
  resetDb();
}

function postReview(): Request {
  return new Request("http://localhost/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Seed data helpers ───────────────────────────────────────────────────────

/** Seed a meal logged recently (within 90-day window). */
async function seedRecentMeal(db: Client): Promise<void> {
  const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  await insertMeal(
    {
      id: `01MEAL${testCounter}${Date.now()}`,
      logged_at: recentDate,
      description: "Pasta with cheese sauce",
      meal_type: "dinner",
      fodmap_flags: '["D"]',
      ingredients: '["pasta","cheese","cream"]',
      fodmap_detail: '{"D":["cheese","cream"]}',
      portion_size: "large",
      eating_speed: "normal",
    },
    db,
  );
}

async function seedRecentStool(db: Client): Promise<void> {
  const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  await insertStool(
    {
      id: `01STOOL${testCounter}${Date.now()}`,
      logged_at: recentDate,
      bristol_type: 6,
      urgency: 1,
      pain_score: 5,
    },
    db,
  );
}

async function seedRecentContext(db: Client): Promise<void> {
  const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  await insertContext(
    {
      id: `01CTX${testCounter}${Date.now()}`,
      logged_at: recentDate,
      stress_score: 4,
      sleep_hours: 7,
      sleep_quality: 4,
      water_litres: 1.5,
    },
    db,
  );
}

async function seedRecentSymptom(db: Client): Promise<void> {
  const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  await insertSymptom(
    {
      id: `01SYM${testCounter}${Date.now()}`,
      logged_at: recentDate,
      bloating: 6,
      cramping: 5,
      nausea: 2,
      urgency: 7,
      fatigue: 4,
      overall: 6,
    },
    db,
  );
}

// ─── Review route: success with logs in DB ───────────────────────────────────

Deno.test("POST /api/review - logs exist → Claude returns valid ReviewResponse → 200 with hypothesis persisted", async () => {
  const db = await setupTestDb();
  await seedRecentMeal(db);
  await seedRecentStool(db);
  await seedRecentContext(db);
  await seedRecentSymptom(db);

  setAiClient(createMockClient({ text: VALID_REVIEW_RESPONSE }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.summary, "Analysis of 14 days of data shows potential lactose sensitivity.");
  assertEquals(body.hypotheses.length, 1);
  assertEquals(body.hypotheses[0].trigger_name, "Dairy");
  assertEquals(body.hypotheses[0].fodmap_category, "D");
  assertEquals(body.hypotheses[0].confidence_score, 0.55);
  assertEquals(body.hypotheses[0].confidence_label, "Moderate");
  assertEquals(body.hypotheses[0].direction, "worsens");
  assertEquals(body.hypotheses[0].supporting_events, 4);
  assertEquals(body.hypotheses[0].contradicting_events, 1);
  assertEquals(body.hypotheses[0].notes, "Dose-dependent: small amounts tolerated");
  assertEquals(body.days_analysed, 2); // seeded across 2 different dates
  assertEquals(body.entries_analysed, 4);
  assertNotEquals(body.id, undefined);
  assertNotEquals(body.reviewed_at, undefined);

  // Verify persisted in DB
  const stored = await getHypothesis(db);
  assertNotEquals(stored, null);
  assertEquals(stored!.id, body.id);
  assertEquals(stored!.summary, body.summary);

  cleanupTest();
});

// ─── Review route: Claude fails → existing hypothesis preserved ──────────────

Deno.test("POST /api/review - Claude fails → existing hypothesis preserved → error response", async () => {
  const db = await setupTestDb();
  await seedRecentMeal(db);

  // Pre-seed an existing hypothesis
  await upsertHypothesis(
    {
      id: "01EXISTING",
      reviewed_at: "2024-01-10T10:00:00.000Z",
      summary: "Previous analysis",
      days_analysed: 7,
      entries_analysed: 20,
      hypotheses_json: '[{"trigger_name":"Garlic","confidence_score":0.4}]',
    },
    db,
  );

  // Claude fails with generic error
  const err = new Error("Service unavailable");
  (err as unknown as { status: number }).status = 503;
  setAiClient(createMockClient({ error: err }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 503);

  const body = await res.json();
  assertEquals(body.error, "SERVICE_UNAVAILABLE");

  // Existing hypothesis should still be in DB (not deleted)
  const stored = await getHypothesis(db);
  assertNotEquals(stored, null);
  assertEquals(stored!.id, "01EXISTING");
  assertEquals(stored!.summary, "Previous analysis");

  cleanupTest();
});

// ─── Review route: no logs → still calls Claude, returns valid response ──────

Deno.test("POST /api/review - no logs → still calls Claude → returns valid response", async () => {
  await setupTestDb();

  setAiClient(createMockClient({ text: VALID_REVIEW_RESPONSE }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.summary, "Analysis of 14 days of data shows potential lactose sensitivity.");
  assertEquals(body.entries_analysed, 0);
  assertEquals(body.days_analysed, 0);
  assertEquals(body.hypotheses.length, 1);

  cleanupTest();
});

// ─── Review route: Claude timeout → 504 ─────────────────────────────────────

Deno.test("POST /api/review - Claude timeout → 504 response", async () => {
  await setupTestDb();

  const err = new Error("Request timed out");
  err.name = "APIConnectionTimeoutError";
  setAiClient(createMockClient({ error: err }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 504);

  const body = await res.json();
  assertEquals(body.error, "TIMEOUT");

  cleanupTest();
});

// ─── Review route: Claude unavailable → 503 ─────────────────────────────────

Deno.test("POST /api/review - Claude unavailable → 503 response", async () => {
  await setupTestDb();

  const err = new Error("Service unavailable");
  (err as unknown as { status: number }).status = 503;
  setAiClient(createMockClient({ error: err }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 503);

  const body = await res.json();
  assertEquals(body.error, "SERVICE_UNAVAILABLE");

  cleanupTest();
});

// ─── Review route: Claude returns malformed JSON → 503 ───────────────────────

Deno.test("POST /api/review - Claude returns malformed JSON → 503 with parse error", async () => {
  await setupTestDb();

  setAiClient(createMockClient({ text: "This is not valid JSON at all {{{" }));

  const res = await handleReview(postReview());
  assertEquals(res.status, 503);

  const body = await res.json();
  assertEquals(body.error, "SERVICE_UNAVAILABLE");

  cleanupTest();
});

// ─── Review route: wrong method → 405 ───────────────────────────────────────

Deno.test("POST /api/review - GET method → 405", async () => {
  const req = new Request("http://localhost/api/review", { method: "GET" });
  const res = await handleReview(req);
  assertEquals(res.status, 405);

  const body = await res.json();
  assertEquals(body.error, "METHOD_NOT_ALLOWED");
});
