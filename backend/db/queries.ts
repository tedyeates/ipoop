/**
 * Parameterised database query functions.
 * All queries use positional parameters (?) — no string interpolation.
 */

import { type Client, type Row } from "@libsql/client";
import { getDb } from "./client.ts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MealRow {
  id: string;
  logged_at: string;
  meal_type: string | null;
  description: string;
  fodmap_flags: string; // JSON array
  ingredients: string; // JSON array
  fodmap_detail: string; // JSON object
  portion_size: string | null;
  eating_speed: string | null;
  scan_used: number;
}

export interface StoolRow {
  id: string;
  logged_at: string;
  bristol_type: number;
  frequency: number | null;
  urgency: number | null;
  pain_score: number | null;
  blood: number | null;
  notes: string | null;
}

export interface ContextRow {
  id: string;
  logged_at: string;
  stress_score: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_litres: number | null;
  exercise_type: string | null;
  exercise_duration: number | null;
  caffeine_mg: number | null;
  alcohol_units: number | null;
  medications: string | null;
  menstrual_phase: string | null;
  notes: string | null;
}

export interface SymptomRow {
  id: string;
  logged_at: string;
  bloating: number;
  cramping: number;
  nausea: number;
  urgency: number;
  fatigue: number;
  overall: number;
  notes: string | null;
}

export interface HypothesisRow {
  id: string;
  reviewed_at: string;
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses_json: string; // JSON array
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowTo<T>(row: Row): T {
  return row as unknown as T;
}

function rowsTo<T>(rows: Row[]): T[] {
  return rows.map((r) => r as unknown as T);
}

// ─── Meal Queries ────────────────────────────────────────────────────────────

export interface InsertMealParams {
  id: string;
  logged_at: string;
  meal_type?: string | null;
  description: string;
  fodmap_flags?: string; // JSON string
  ingredients?: string; // JSON string
  fodmap_detail?: string; // JSON string
  portion_size?: string | null;
  eating_speed?: string | null;
  scan_used?: number;
}

export async function insertMeal(
  params: InsertMealParams,
  client?: Client,
): Promise<void> {
  const db = client ?? getDb();
  await db.execute({
    sql: `INSERT INTO meal_logs (id, logged_at, meal_type, description, fodmap_flags, ingredients, fodmap_detail, portion_size, eating_speed, scan_used)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      params.logged_at,
      params.meal_type ?? null,
      params.description,
      params.fodmap_flags ?? "[]",
      params.ingredients ?? "[]",
      params.fodmap_detail ?? "{}",
      params.portion_size ?? null,
      params.eating_speed ?? null,
      params.scan_used ?? 0,
    ],
  });
}

export async function getMeals(
  options?: { since?: string },
  client?: Client,
): Promise<MealRow[]> {
  const db = client ?? getDb();
  if (options?.since) {
    const result = await db.execute({
      sql: `SELECT * FROM meal_logs WHERE logged_at >= ? ORDER BY logged_at DESC`,
      args: [options.since],
    });
    return rowsTo<MealRow>(result.rows);
  }
  const result = await db.execute({
    sql: `SELECT * FROM meal_logs ORDER BY logged_at DESC`,
    args: [],
  });
  return rowsTo<MealRow>(result.rows);
}

// ─── Stool Queries ───────────────────────────────────────────────────────────

export interface InsertStoolParams {
  id: string;
  logged_at: string;
  bristol_type: number;
  frequency?: number | null;
  urgency?: number | null;
  pain_score?: number | null;
  blood?: number | null;
  notes?: string | null;
}

export async function insertStool(
  params: InsertStoolParams,
  client?: Client,
): Promise<void> {
  const db = client ?? getDb();
  await db.execute({
    sql: `INSERT INTO stool_logs (id, logged_at, bristol_type, frequency, urgency, pain_score, blood, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      params.logged_at,
      params.bristol_type,
      params.frequency ?? null,
      params.urgency ?? null,
      params.pain_score ?? null,
      params.blood ?? null,
      params.notes ?? null,
    ],
  });
}

export async function getStools(
  options?: { since?: string },
  client?: Client,
): Promise<StoolRow[]> {
  const db = client ?? getDb();
  if (options?.since) {
    const result = await db.execute({
      sql: `SELECT * FROM stool_logs WHERE logged_at >= ? ORDER BY logged_at DESC`,
      args: [options.since],
    });
    return rowsTo<StoolRow>(result.rows);
  }
  const result = await db.execute({
    sql: `SELECT * FROM stool_logs ORDER BY logged_at DESC`,
    args: [],
  });
  return rowsTo<StoolRow>(result.rows);
}

// ─── Context Queries ─────────────────────────────────────────────────────────

export interface InsertContextParams {
  id: string;
  logged_at: string;
  stress_score?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  water_litres?: number | null;
  exercise_type?: string | null;
  exercise_duration?: number | null;
  caffeine_mg?: number | null;
  alcohol_units?: number | null;
  medications?: string | null;
  menstrual_phase?: string | null;
  notes?: string | null;
}

export async function insertContext(
  params: InsertContextParams,
  client?: Client,
): Promise<void> {
  const db = client ?? getDb();
  await db.execute({
    sql: `INSERT INTO context_logs (id, logged_at, stress_score, sleep_hours, sleep_quality, water_litres, exercise_type, exercise_duration, caffeine_mg, alcohol_units, medications, menstrual_phase, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      params.logged_at,
      params.stress_score ?? null,
      params.sleep_hours ?? null,
      params.sleep_quality ?? null,
      params.water_litres ?? null,
      params.exercise_type ?? null,
      params.exercise_duration ?? null,
      params.caffeine_mg ?? null,
      params.alcohol_units ?? null,
      params.medications ?? null,
      params.menstrual_phase ?? null,
      params.notes ?? null,
    ],
  });
}

export async function getContext(
  options?: { since?: string },
  client?: Client,
): Promise<ContextRow[]> {
  const db = client ?? getDb();
  if (options?.since) {
    const result = await db.execute({
      sql: `SELECT * FROM context_logs WHERE logged_at >= ? ORDER BY logged_at DESC`,
      args: [options.since],
    });
    return rowsTo<ContextRow>(result.rows);
  }
  const result = await db.execute({
    sql: `SELECT * FROM context_logs ORDER BY logged_at DESC`,
    args: [],
  });
  return rowsTo<ContextRow>(result.rows);
}

// ─── Symptom Queries ─────────────────────────────────────────────────────────

export interface InsertSymptomParams {
  id: string;
  logged_at: string;
  bloating: number;
  cramping: number;
  nausea: number;
  urgency: number;
  fatigue: number;
  overall: number;
  notes?: string | null;
}

export async function insertSymptom(
  params: InsertSymptomParams,
  client?: Client,
): Promise<void> {
  const db = client ?? getDb();
  await db.execute({
    sql: `INSERT INTO symptom_logs (id, logged_at, bloating, cramping, nausea, urgency, fatigue, overall, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      params.logged_at,
      params.bloating,
      params.cramping,
      params.nausea,
      params.urgency,
      params.fatigue,
      params.overall,
      params.notes ?? null,
    ],
  });
}

export async function getSymptoms(
  options?: { since?: string },
  client?: Client,
): Promise<SymptomRow[]> {
  const db = client ?? getDb();
  if (options?.since) {
    const result = await db.execute({
      sql: `SELECT * FROM symptom_logs WHERE logged_at >= ? ORDER BY logged_at DESC`,
      args: [options.since],
    });
    return rowsTo<SymptomRow>(result.rows);
  }
  const result = await db.execute({
    sql: `SELECT * FROM symptom_logs ORDER BY logged_at DESC`,
    args: [],
  });
  return rowsTo<SymptomRow>(result.rows);
}

// ─── Hypothesis Queries ──────────────────────────────────────────────────────

export interface UpsertHypothesisParams {
  id: string;
  reviewed_at: string;
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses_json: string; // JSON string
}

/**
 * Upsert hypothesis — deletes all existing records then inserts new one.
 * At most one hypothesis record exists at any time.
 */
export async function upsertHypothesis(
  params: UpsertHypothesisParams,
  client?: Client,
): Promise<void> {
  const db = client ?? getDb();
  await db.execute({ sql: `DELETE FROM hypotheses`, args: [] });
  await db.execute({
    sql: `INSERT INTO hypotheses (id, reviewed_at, summary, days_analysed, entries_analysed, hypotheses_json)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      params.reviewed_at,
      params.summary,
      params.days_analysed,
      params.entries_analysed,
      params.hypotheses_json,
    ],
  });
}

export async function getHypothesis(
  client?: Client,
): Promise<HypothesisRow | null> {
  const db = client ?? getDb();
  const result = await db.execute({
    sql: `SELECT * FROM hypotheses LIMIT 1`,
    args: [],
  });
  if (result.rows.length === 0) return null;
  return rowTo<HypothesisRow>(result.rows[0]);
}

export async function deleteHypothesis(client?: Client): Promise<void> {
  const db = client ?? getDb();
  await db.execute({ sql: `DELETE FROM hypotheses`, args: [] });
}
