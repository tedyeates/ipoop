-- IBS Trigger Tracker — Database Schema
-- All primary keys are ULIDs (TEXT). All timestamps are ISO8601 (TEXT).

CREATE TABLE IF NOT EXISTS meal_logs (
  id           TEXT PRIMARY KEY,
  logged_at    TEXT NOT NULL,
  meal_type    TEXT,
  description  TEXT NOT NULL,
  fodmap_flags TEXT NOT NULL DEFAULT '[]',
  ingredients  TEXT NOT NULL DEFAULT '[]',
  fodmap_detail TEXT NOT NULL DEFAULT '{}',
  portion_size TEXT,
  eating_speed TEXT,
  scan_used    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stool_logs (
  id           TEXT PRIMARY KEY,
  logged_at    TEXT NOT NULL,
  bristol_type INTEGER NOT NULL,
  frequency    INTEGER,
  urgency      INTEGER,
  pain_score   INTEGER,
  blood        INTEGER,
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS context_logs (
  id                TEXT PRIMARY KEY,
  logged_at         TEXT NOT NULL,
  stress_score      INTEGER,
  sleep_hours       REAL,
  sleep_quality     INTEGER,
  water_litres      REAL,
  exercise_type     TEXT,
  exercise_duration INTEGER,
  caffeine_mg       INTEGER,
  alcohol_units     REAL,
  medications       TEXT,
  menstrual_phase   TEXT,
  notes             TEXT
);

CREATE TABLE IF NOT EXISTS symptom_logs (
  id        TEXT PRIMARY KEY,
  logged_at TEXT NOT NULL,
  bloating  INTEGER NOT NULL,
  cramping  INTEGER NOT NULL,
  nausea    INTEGER NOT NULL,
  urgency   INTEGER NOT NULL,
  fatigue   INTEGER NOT NULL,
  overall   INTEGER NOT NULL,
  notes     TEXT
);

CREATE TABLE IF NOT EXISTS hypotheses (
  id               TEXT PRIMARY KEY,
  reviewed_at      TEXT NOT NULL,
  summary          TEXT NOT NULL,
  days_analysed    INTEGER NOT NULL,
  entries_analysed INTEGER NOT NULL,
  hypotheses_json  TEXT NOT NULL
);

-- Indexes for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_stool_logs_logged_at ON stool_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_context_logs_logged_at ON context_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_logged_at ON symptom_logs(logged_at);
