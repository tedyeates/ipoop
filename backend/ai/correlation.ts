import type { MealLogRow, SymptomLogRow } from "../db/queries.ts";

const TRANSIT_MIN_MS = 6 * 60 * 60 * 1000;  // 6 hours
const TRANSIT_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours
const SYMPTOM_THRESHOLD = 4;

export interface CorrelatedPair {
  meal: MealLogRow;
  symptom: SymptomLogRow;
}

export function findCorrelatedPairs(
  meals: MealLogRow[],
  symptoms: SymptomLogRow[],
): CorrelatedPair[] {
  const pairs: CorrelatedPair[] = [];

  for (const meal of meals) {
    const mealTime = new Date(meal.logged_at).getTime();

    for (const symptom of symptoms) {
      if (!isSignificantSymptom(symptom)) continue;

      const symptomTime = new Date(symptom.logged_at).getTime();
      const delta = symptomTime - mealTime;

      if (delta >= TRANSIT_MIN_MS && delta <= TRANSIT_MAX_MS) {
        pairs.push({ meal, symptom });
      }
    }
  }

  return pairs;
}

function isSignificantSymptom(s: SymptomLogRow): boolean {
  return (
    s.bloating >= SYMPTOM_THRESHOLD ||
    s.cramping >= SYMPTOM_THRESHOLD ||
    s.nausea >= SYMPTOM_THRESHOLD ||
    s.urgency >= SYMPTOM_THRESHOLD ||
    s.fatigue >= SYMPTOM_THRESHOLD ||
    s.overall >= SYMPTOM_THRESHOLD
  );
}
