import type { Client } from "@libsql/client";
import client from "./client.ts";

// --- Meal Logs ---

export interface MealLogRow {
  id: string;
  logged_at: string;
  meal_type: string | null;
  description: string;
  fodmap_flags: string;
  ingredients: string;
  fodmap_detail: string;
  portion_size: string | null;
  eating_speed: string | null;
  scan_used: number;
}

export async function insertMealLog(
  row: MealLogRow,
  db: Client = client,
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO meal_logs (id, logged_at, meal_type, description, fodmap_flags, ingredients, fodmap_detail, portion_size, eating_speed, scan_used)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.logged_at, row.meal_type, row.description, row.fodmap_flags, row.ingredients, row.fodmap_detail, row.portion_size, row.eating_speed, row.scan_used],
  });
}

export async function getMealLogs(
  since?: string,
  db: Client = client,
): Promise<MealLogRow[]> {
  const sql = since
    ? "SELECT * FROM meal_logs WHERE logged_at >= ? ORDER BY logged_at DESC"
    : "SELECT * FROM meal_logs ORDER BY logged_at DESC";
  const args = since ? [since] : [];
  const result = await db.execute({ sql, args });
  return result.rows as unknown as MealLogRow[];
}

// --- Stool Logs ---

export interface StoolLogRow {
  id: string;
  logged_at: string;
  bristol_type: number;
  frequency: number | null;
  urgency: number | null;
  pain_score: number | null;
  blood: number | null;
  notes: string | null;
}

export async function insertStoolLog(
  row: StoolLogRow,
  db: Client = client,
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO stool_logs (id, logged_at, bristol_type, frequency, urgency, pain_score, blood, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.logged_at, row.bristol_type, row.frequency, row.urgency, row.pain_score, row.blood, row.notes],
  });
}

export async function getStoolLogs(
  since?: string,
  db: Client = client,
): Promise<StoolLogRow[]> {
  const sql = since
    ? "SELECT * FROM stool_logs WHERE logged_at >= ? ORDER BY logged_at DESC"
    : "SELECT * FROM stool_logs ORDER BY logged_at DESC";
  const args = since ? [since] : [];
  const result = await db.execute({ sql, args });
  return result.rows as unknown as StoolLogRow[];
}

// --- Context Logs ---

export interface ContextLogRow {
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

export async function insertContextLog(
  row: ContextLogRow,
  db: Client = client,
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO context_logs (id, logged_at, stress_score, sleep_hours, sleep_quality, water_litres, exercise_type, exercise_duration, caffeine_mg, alcohol_units, medications, menstrual_phase, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.logged_at, row.stress_score, row.sleep_hours, row.sleep_quality, row.water_litres, row.exercise_type, row.exercise_duration, row.caffeine_mg, row.alcohol_units, row.medications, row.menstrual_phase, row.notes],
  });
}

export async function getContextLogs(
  since?: string,
  db: Client = client,
): Promise<ContextLogRow[]> {
  const sql = since
    ? "SELECT * FROM context_logs WHERE logged_at >= ? ORDER BY logged_at DESC"
    : "SELECT * FROM context_logs ORDER BY logged_at DESC";
  const args = since ? [since] : [];
  const result = await db.execute({ sql, args });
  return result.rows as unknown as ContextLogRow[];
}

// --- Symptom Logs ---

export interface SymptomLogRow {
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

export async function insertSymptomLog(
  row: SymptomLogRow,
  db: Client = client,
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO symptom_logs (id, logged_at, bloating, cramping, nausea, urgency, fatigue, overall, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.logged_at, row.bloating, row.cramping, row.nausea, row.urgency, row.fatigue, row.overall, row.notes],
  });
}

export async function getSymptomLogs(
  since?: string,
  db: Client = client,
): Promise<SymptomLogRow[]> {
  const sql = since
    ? "SELECT * FROM symptom_logs WHERE logged_at >= ? ORDER BY logged_at DESC"
    : "SELECT * FROM symptom_logs ORDER BY logged_at DESC";
  const args = since ? [since] : [];
  const result = await db.execute({ sql, args });
  return result.rows as unknown as SymptomLogRow[];
}

// --- Hypotheses ---

export interface HypothesisRow {
  id: string;
  reviewed_at: string;
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses_json: string;
}

export async function upsertHypothesis(
  row: HypothesisRow,
  db: Client = client,
): Promise<void> {
  await db.execute({ sql: "DELETE FROM hypotheses", args: [] });
  await db.execute({
    sql: `INSERT INTO hypotheses (id, reviewed_at, summary, days_analysed, entries_analysed, hypotheses_json)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.reviewed_at, row.summary, row.days_analysed, row.entries_analysed, row.hypotheses_json],
  });
}

export async function getHypothesis(
  db: Client = client,
): Promise<HypothesisRow | null> {
  const result = await db.execute({ sql: "SELECT * FROM hypotheses LIMIT 1", args: [] });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as HypothesisRow;
}

export async function deleteHypothesis(
  db: Client = client,
): Promise<void> {
  await db.execute({ sql: "DELETE FROM hypotheses", args: [] });
}
