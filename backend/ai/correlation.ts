/**
 * Transit window correlation for AI hypothesis engine.
 * Pure functions — no external dependencies, no side effects.
 *
 * A symptom is correlated with a meal if:
 *   1. The symptom occurs 6–24 hours after the meal (inclusive boundaries)
 *   2. At least one symptom dimension scores ≥4
 *
 * All timestamps are ISO8601 strings.
 */

/** Minimum transit window in milliseconds (6 hours). */
const TRANSIT_MIN_MS = 6 * 60 * 60 * 1000;

/** Maximum transit window in milliseconds (24 hours). */
const TRANSIT_MAX_MS = 24 * 60 * 60 * 1000;

/** Symptom severity threshold for correlation trigger. */
const SEVERITY_THRESHOLD = 4;

/** A meal event with timestamp. */
export interface MealEvent {
  id: string;
  logged_at: string; // ISO8601
}

/** A symptom event with timestamp and dimension scores. */
export interface SymptomEvent {
  id: string;
  logged_at: string; // ISO8601
  bloating: number;
  cramping: number;
  nausea: number;
  urgency: number;
  fatigue: number;
  overall: number;
}

/** A correlation result linking a meal to a symptom. */
export interface CorrelationResult {
  meal_id: string;
  symptom_id: string;
  delay_hours: number;
  triggered_dimensions: string[];
}

/**
 * Check if a symptom event has at least one dimension ≥ severity threshold.
 */
export function meetsSymptomThreshold(symptom: SymptomEvent): boolean {
  return (
    symptom.bloating >= SEVERITY_THRESHOLD ||
    symptom.cramping >= SEVERITY_THRESHOLD ||
    symptom.nausea >= SEVERITY_THRESHOLD ||
    symptom.urgency >= SEVERITY_THRESHOLD ||
    symptom.fatigue >= SEVERITY_THRESHOLD ||
    symptom.overall >= SEVERITY_THRESHOLD
  );
}

/**
 * Get which dimensions meet the severity threshold.
 */
export function getTriggeredDimensions(symptom: SymptomEvent): string[] {
  const dims: string[] = [];
  if (symptom.bloating >= SEVERITY_THRESHOLD) dims.push("bloating");
  if (symptom.cramping >= SEVERITY_THRESHOLD) dims.push("cramping");
  if (symptom.nausea >= SEVERITY_THRESHOLD) dims.push("nausea");
  if (symptom.urgency >= SEVERITY_THRESHOLD) dims.push("urgency");
  if (symptom.fatigue >= SEVERITY_THRESHOLD) dims.push("fatigue");
  if (symptom.overall >= SEVERITY_THRESHOLD) dims.push("overall");
  return dims;
}

/**
 * Check if a symptom timestamp falls within the transit window of a meal.
 * Window is 6–24 hours after meal, inclusive on both boundaries.
 */
export function isWithinTransitWindow(
  mealTimestamp: string,
  symptomTimestamp: string,
): boolean {
  const mealTime = new Date(mealTimestamp).getTime();
  const symptomTime = new Date(symptomTimestamp).getTime();
  const delay = symptomTime - mealTime;
  return delay >= TRANSIT_MIN_MS && delay <= TRANSIT_MAX_MS;
}

/**
 * Compute the delay in hours between a meal and a symptom.
 */
export function computeDelayHours(
  mealTimestamp: string,
  symptomTimestamp: string,
): number {
  const mealTime = new Date(mealTimestamp).getTime();
  const symptomTime = new Date(symptomTimestamp).getTime();
  return (symptomTime - mealTime) / (60 * 60 * 1000);
}

/**
 * Find all correlations between meals and symptoms.
 * A correlation exists when:
 *   - The symptom occurs 6–24 hours after the meal (inclusive)
 *   - At least one symptom dimension scores ≥4
 *
 * Returns all meal-symptom pairs that are correlated.
 */
export function findCorrelations(
  meals: MealEvent[],
  symptoms: SymptomEvent[],
): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  for (const meal of meals) {
    for (const symptom of symptoms) {
      // Check severity threshold first (cheaper check)
      if (!meetsSymptomThreshold(symptom)) continue;

      // Check transit window
      if (!isWithinTransitWindow(meal.logged_at, symptom.logged_at)) continue;

      results.push({
        meal_id: meal.id,
        symptom_id: symptom.id,
        delay_hours: computeDelayHours(meal.logged_at, symptom.logged_at),
        triggered_dimensions: getTriggeredDimensions(symptom),
      });
    }
  }

  return results;
}
