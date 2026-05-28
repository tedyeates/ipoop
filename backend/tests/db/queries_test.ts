/**
 * Database query tests — real local SQLite, no mocks.
 * Each test gets a fresh temp DB with schema applied.
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createTestDb } from "../../db/client.ts";
import { applySchema } from "../../db/migrate.ts";
import {
  insertMeal,
  getMeals,
  insertStool,
  getStools,
  insertContext,
  getContext,
  insertSymptom,
  getSymptoms,
  upsertHypothesis,
  getHypothesis,
  deleteHypothesis,
} from "../../db/queries.ts";
import type { Client } from "@libsql/client";

let testCounter = 0;

async function freshDb(): Promise<Client> {
  testCounter++;
  const path = `data/test_queries_${testCounter}_${Date.now()}.db`;
  const client = createTestDb(path);
  await applySchema(client);
  return client;
}

// ─── Meal Queries ────────────────────────────────────────────────────────────

Deno.test("insertMeal + getMeals - round trip minimal", async () => {
  const db = await freshDb();
  await insertMeal({
    id: "01HTEST000000000000000001",
    logged_at: "2024-01-15T10:30:00.000Z",
    description: "Toast with butter",
  }, db);

  const rows = await getMeals(undefined, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].id, "01HTEST000000000000000001");
  assertEquals(rows[0].description, "Toast with butter");
  assertEquals(rows[0].meal_type, null);
  assertEquals(rows[0].fodmap_flags, "[]");
  assertEquals(rows[0].ingredients, "[]");
  assertEquals(rows[0].fodmap_detail, "{}");
  assertEquals(rows[0].portion_size, null);
  assertEquals(rows[0].eating_speed, null);
  assertEquals(rows[0].scan_used, 0);
});

Deno.test("insertMeal + getMeals - round trip full", async () => {
  const db = await freshDb();
  await insertMeal({
    id: "01HTEST000000000000000002",
    logged_at: "2024-01-15T12:00:00.000Z",
    meal_type: "lunch",
    description: "Big salad with chickpeas",
    fodmap_flags: '["F","O"]',
    ingredients: '["chickpeas","lettuce","tomato"]',
    fodmap_detail: '{"F":["chickpeas"],"O":["chickpeas"]}',
    portion_size: "large",
    eating_speed: "slow",
    scan_used: 1,
  }, db);

  const rows = await getMeals(undefined, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].meal_type, "lunch");
  assertEquals(rows[0].fodmap_flags, '["F","O"]');
  assertEquals(rows[0].ingredients, '["chickpeas","lettuce","tomato"]');
  assertEquals(rows[0].portion_size, "large");
  assertEquals(rows[0].eating_speed, "slow");
  assertEquals(rows[0].scan_used, 1);
});

Deno.test("getMeals - filters by since", async () => {
  const db = await freshDb();
  await insertMeal({
    id: "01HTEST000000000000000003",
    logged_at: "2024-01-10T08:00:00.000Z",
    description: "Old meal",
  }, db);
  await insertMeal({
    id: "01HTEST000000000000000004",
    logged_at: "2024-01-15T08:00:00.000Z",
    description: "Recent meal",
  }, db);

  const rows = await getMeals({ since: "2024-01-14T00:00:00.000Z" }, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].description, "Recent meal");
});

Deno.test("getMeals - returns descending order", async () => {
  const db = await freshDb();
  await insertMeal({ id: "01A", logged_at: "2024-01-10T08:00:00.000Z", description: "First" }, db);
  await insertMeal({ id: "01B", logged_at: "2024-01-12T08:00:00.000Z", description: "Second" }, db);
  await insertMeal({ id: "01C", logged_at: "2024-01-11T08:00:00.000Z", description: "Middle" }, db);

  const rows = await getMeals(undefined, db);
  assertEquals(rows[0].description, "Second");
  assertEquals(rows[1].description, "Middle");
  assertEquals(rows[2].description, "First");
});

// ─── Stool Queries ───────────────────────────────────────────────────────────

Deno.test("insertStool + getStools - round trip minimal", async () => {
  const db = await freshDb();
  await insertStool({
    id: "01HTEST000000000000000010",
    logged_at: "2024-01-15T07:00:00.000Z",
    bristol_type: 4,
  }, db);

  const rows = await getStools(undefined, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].bristol_type, 4);
  assertEquals(rows[0].frequency, null);
  assertEquals(rows[0].urgency, null);
  assertEquals(rows[0].pain_score, null);
  assertEquals(rows[0].blood, null);
  assertEquals(rows[0].notes, null);
});

Deno.test("insertStool + getStools - round trip full", async () => {
  const db = await freshDb();
  await insertStool({
    id: "01HTEST000000000000000011",
    logged_at: "2024-01-15T07:30:00.000Z",
    bristol_type: 6,
    frequency: 3,
    urgency: 1,
    pain_score: 7,
    blood: 0,
    notes: "Rough morning",
  }, db);

  const rows = await getStools(undefined, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].frequency, 3);
  assertEquals(rows[0].urgency, 1);
  assertEquals(rows[0].pain_score, 7);
  assertEquals(rows[0].blood, 0);
  assertEquals(rows[0].notes, "Rough morning");
});

Deno.test("getStools - filters by since", async () => {
  const db = await freshDb();
  await insertStool({ id: "01A", logged_at: "2024-01-01T08:00:00.000Z", bristol_type: 3 }, db);
  await insertStool({ id: "01B", logged_at: "2024-01-15T08:00:00.000Z", bristol_type: 5 }, db);

  const rows = await getStools({ since: "2024-01-10T00:00:00.000Z" }, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].bristol_type, 5);
});

Deno.test("getStools - returns descending order", async () => {
  const db = await freshDb();
  await insertStool({ id: "01A", logged_at: "2024-01-10T08:00:00.000Z", bristol_type: 2 }, db);
  await insertStool({ id: "01B", logged_at: "2024-01-12T08:00:00.000Z", bristol_type: 4 }, db);
  await insertStool({ id: "01C", logged_at: "2024-01-11T08:00:00.000Z", bristol_type: 3 }, db);

  const rows = await getStools(undefined, db);
  assertEquals(rows[0].bristol_type, 4);
  assertEquals(rows[1].bristol_type, 3);
  assertEquals(rows[2].bristol_type, 2);
});

// ─── Context Queries ─────────────────────────────────────────────────────────

Deno.test("insertContext + getContext - round trip", async () => {
  const db = await freshDb();
  await insertContext({
    id: "01HTEST000000000000000020",
    logged_at: "2024-01-15T22:00:00.000Z",
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
  }, db);

  const rows = await getContext(undefined, db);
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

Deno.test("insertContext - null optional fields", async () => {
  const db = await freshDb();
  await insertContext({
    id: "01HTEST000000000000000021",
    logged_at: "2024-01-15T22:00:00.000Z",
    stress_score: 5,
  }, db);

  const rows = await getContext(undefined, db);
  assertEquals(rows[0].sleep_hours, null);
  assertEquals(rows[0].exercise_type, null);
  assertEquals(rows[0].notes, null);
});

Deno.test("getContext - filters by since", async () => {
  const db = await freshDb();
  await insertContext({ id: "01A", logged_at: "2024-01-01T08:00:00.000Z", stress_score: 3 }, db);
  await insertContext({ id: "01B", logged_at: "2024-01-15T08:00:00.000Z", stress_score: 8 }, db);

  const rows = await getContext({ since: "2024-01-10T00:00:00.000Z" }, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].stress_score, 8);
});

Deno.test("getContext - returns descending order", async () => {
  const db = await freshDb();
  await insertContext({ id: "01A", logged_at: "2024-01-10T08:00:00.000Z", stress_score: 2 }, db);
  await insertContext({ id: "01B", logged_at: "2024-01-12T08:00:00.000Z", stress_score: 7 }, db);
  await insertContext({ id: "01C", logged_at: "2024-01-11T08:00:00.000Z", stress_score: 5 }, db);

  const rows = await getContext(undefined, db);
  assertEquals(rows[0].stress_score, 7);
  assertEquals(rows[1].stress_score, 5);
  assertEquals(rows[2].stress_score, 2);
});

// ─── Symptom Queries ─────────────────────────────────────────────────────────

Deno.test("insertSymptom + getSymptoms - round trip", async () => {
  const db = await freshDb();
  await insertSymptom({
    id: "01HTEST000000000000000030",
    logged_at: "2024-01-15T14:00:00.000Z",
    bloating: 6,
    cramping: 4,
    nausea: 2,
    urgency: 8,
    fatigue: 5,
    overall: 7,
    notes: "After lunch",
  }, db);

  const rows = await getSymptoms(undefined, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].bloating, 6);
  assertEquals(rows[0].cramping, 4);
  assertEquals(rows[0].nausea, 2);
  assertEquals(rows[0].urgency, 8);
  assertEquals(rows[0].fatigue, 5);
  assertEquals(rows[0].overall, 7);
  assertEquals(rows[0].notes, "After lunch");
});

Deno.test("getSymptoms - filters by since", async () => {
  const db = await freshDb();
  await insertSymptom({
    id: "01A", logged_at: "2024-01-01T08:00:00.000Z",
    bloating: 1, cramping: 1, nausea: 1, urgency: 1, fatigue: 1, overall: 1,
  }, db);
  await insertSymptom({
    id: "01B", logged_at: "2024-01-15T08:00:00.000Z",
    bloating: 9, cramping: 9, nausea: 9, urgency: 9, fatigue: 9, overall: 9,
  }, db);

  const rows = await getSymptoms({ since: "2024-01-10T00:00:00.000Z" }, db);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].overall, 9);
});

Deno.test("getSymptoms - returns descending order", async () => {
  const db = await freshDb();
  await insertSymptom({
    id: "01A", logged_at: "2024-01-10T08:00:00.000Z",
    bloating: 1, cramping: 1, nausea: 1, urgency: 1, fatigue: 1, overall: 2,
  }, db);
  await insertSymptom({
    id: "01B", logged_at: "2024-01-12T08:00:00.000Z",
    bloating: 5, cramping: 5, nausea: 5, urgency: 5, fatigue: 5, overall: 8,
  }, db);
  await insertSymptom({
    id: "01C", logged_at: "2024-01-11T08:00:00.000Z",
    bloating: 3, cramping: 3, nausea: 3, urgency: 3, fatigue: 3, overall: 5,
  }, db);

  const rows = await getSymptoms(undefined, db);
  assertEquals(rows[0].overall, 8);
  assertEquals(rows[1].overall, 5);
  assertEquals(rows[2].overall, 2);
});

Deno.test("insertSymptom - null notes preserved", async () => {
  const db = await freshDb();
  await insertSymptom({
    id: "01NULLNOTES",
    logged_at: "2024-01-15T14:00:00.000Z",
    bloating: 3, cramping: 2, nausea: 1, urgency: 4, fatigue: 2, overall: 3,
  }, db);

  const rows = await getSymptoms(undefined, db);
  assertEquals(rows[0].notes, null);
});

// ─── Hypothesis Queries ──────────────────────────────────────────────────────

Deno.test("upsertHypothesis + getHypothesis - creates record", async () => {
  const db = await freshDb();
  await upsertHypothesis({
    id: "01HTEST000000000000000040",
    reviewed_at: "2024-01-15T20:00:00.000Z",
    summary: "High FODMAP meals correlate with symptoms.",
    days_analysed: 14,
    entries_analysed: 42,
    hypotheses_json: '[{"trigger_name":"Garlic","confidence_score":0.72}]',
  }, db);

  const row = await getHypothesis(db);
  assertNotEquals(row, null);
  assertEquals(row!.id, "01HTEST000000000000000040");
  assertEquals(row!.summary, "High FODMAP meals correlate with symptoms.");
  assertEquals(row!.days_analysed, 14);
  assertEquals(row!.entries_analysed, 42);
  assertEquals(row!.hypotheses_json, '[{"trigger_name":"Garlic","confidence_score":0.72}]');
});

Deno.test("upsertHypothesis - overwrites existing record", async () => {
  const db = await freshDb();
  await upsertHypothesis({
    id: "01FIRST",
    reviewed_at: "2024-01-10T10:00:00.000Z",
    summary: "First review",
    days_analysed: 7,
    entries_analysed: 20,
    hypotheses_json: "[]",
  }, db);
  await upsertHypothesis({
    id: "01SECOND",
    reviewed_at: "2024-01-15T10:00:00.000Z",
    summary: "Second review",
    days_analysed: 14,
    entries_analysed: 50,
    hypotheses_json: '[{"trigger_name":"Onion"}]',
  }, db);

  const row = await getHypothesis(db);
  assertEquals(row!.id, "01SECOND");
  assertEquals(row!.summary, "Second review");
});

Deno.test("getHypothesis - returns null when empty", async () => {
  const db = await freshDb();
  const row = await getHypothesis(db);
  assertEquals(row, null);
});

Deno.test("deleteHypothesis - removes record", async () => {
  const db = await freshDb();
  await upsertHypothesis({
    id: "01DEL",
    reviewed_at: "2024-01-15T10:00:00.000Z",
    summary: "To be deleted",
    days_analysed: 7,
    entries_analysed: 10,
    hypotheses_json: "[]",
  }, db);

  await deleteHypothesis(db);
  const row = await getHypothesis(db);
  assertEquals(row, null);
});
