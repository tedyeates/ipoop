/**
 * Confidence scoring for AI hypothesis engine.
 * Pure functions — no external dependencies, no side effects.
 *
 * Confidence labels:
 *   Low:       0.00–0.39
 *   Moderate:  0.40–0.64
 *   High:      0.65–0.84
 *   Very High: 0.85–1.00
 */

/** Confidence label type. */
export type ConfidenceLabel = "Low" | "Moderate" | "High" | "Very High";

/** Confounder data for a symptom day. */
export interface ConfoundersOnDay {
  stress?: number; // 1–10
  sleep_quality?: number; // 1–5
  water_litres?: number; // 0.0–20.0
}

/** Input for applying all confidence rules. */
export interface ConfidenceInput {
  rawScore: number; // 0.00–1.00
  daysOfData: number;
  supportingEvents: number;
  confounders?: ConfoundersOnDay;
}

/** Output after applying all confidence rules. */
export interface ConfidenceResult {
  score: number;
  label: ConfidenceLabel;
}

/** Assign a confidence label from a numeric score. */
export function assignLabel(score: number): ConfidenceLabel {
  if (score < 0.40) return "Low";
  if (score < 0.65) return "Moderate";
  if (score < 0.85) return "High";
  return "Very High";
}

/** Cap score based on data sufficiency (days of data). */
export function applyDataSufficiencyCap(
  score: number,
  daysOfData: number,
): number {
  if (daysOfData < 7) return Math.min(score, 0.39);
  if (daysOfData < 14) return Math.min(score, 0.64);
  return score;
}

/** Cap score based on supporting events count. */
export function applySupportingEventsCap(
  score: number,
  supportingEvents: number,
): number {
  if (supportingEvents < 3) return Math.min(score, 0.50);
  return score;
}

/** Check if any confounder is elevated. */
export function hasElevatedConfounders(confounders: ConfoundersOnDay): boolean {
  if (confounders.stress !== undefined && confounders.stress >= 7) return true;
  if (confounders.sleep_quality !== undefined && confounders.sleep_quality <= 2)
    return true;
  if (confounders.water_litres !== undefined && confounders.water_litres < 1.0)
    return true;
  return false;
}

/** Reduce score by confounder penalty (≥0.15) when confounders are elevated. */
export function applyConfounderReduction(
  score: number,
  confounders?: ConfoundersOnDay,
): number {
  if (!confounders) return score;
  if (!hasElevatedConfounders(confounders)) return score;
  return Math.max(0, score - 0.15);
}

/**
 * Apply all confidence rules to a raw score.
 * Order: confounder reduction → supporting events cap → data sufficiency cap → label.
 */
export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  let score = input.rawScore;

  // Apply confounder reduction first (reduces raw score)
  score = applyConfounderReduction(score, input.confounders);

  // Apply supporting events cap
  score = applySupportingEventsCap(score, input.supportingEvents);

  // Apply data sufficiency cap (most restrictive, applied last)
  score = applyDataSufficiencyCap(score, input.daysOfData);

  // Round to 2 decimal places to avoid floating point drift
  score = Math.round(score * 100) / 100;

  const label = assignLabel(score);
  return { score, label };
}
