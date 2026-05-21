import type {
  MealLog,
  StoolLog,
  ContextLog,
  SymptomLog,
  ReviewResponse,
  ScanResponse,
  CreateMealRequest,
  CreateStoolRequest,
  CreateContextRequest,
  CreateSymptomRequest,
} from "../lib/types";
import {
  meals as seedMeals,
  stools as seedStools,
  contexts as seedContexts,
  symptoms as seedSymptoms,
  hypothesis as seedHypothesis,
} from "./data";

// In-memory store
let meals = [...seedMeals];
let stools = [...seedStools];
let contexts = [...seedContexts];
let symptoms = [...seedSymptoms];
let hypothesis: ReviewResponse | null = { ...seedHypothesis };

const delay = () =>
  new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

let counter = 100;
const ulid = () => `01J0000000MOCK${String(counter++).padStart(10, "0")}`;

export async function createMeal(req: CreateMealRequest): Promise<MealLog> {
  await delay();
  const entry: MealLog = {
    id: ulid(),
    logged_at: new Date().toISOString(),
    meal_type: req.meal_type ?? null,
    description: req.description,
    fodmap_flags: req.fodmap_flags ?? [],
    ingredients: req.ingredients ?? [],
    fodmap_detail: req.fodmap_detail ?? {},
    portion_size: req.portion_size ?? null,
    eating_speed: req.eating_speed ?? null,
    scan_used: req.scan_used ? 1 : 0,
  };
  meals.unshift(entry);
  return entry;
}

export async function createStool(req: CreateStoolRequest): Promise<StoolLog> {
  await delay();
  const entry: StoolLog = {
    id: ulid(),
    logged_at: new Date().toISOString(),
    bristol_type: req.bristol_type,
    frequency: req.frequency ?? null,
    urgency: req.urgency ? 1 : 0,
    pain_score: req.pain_score ?? null,
    blood: req.blood ? 1 : 0,
    notes: req.notes ?? null,
  };
  stools.unshift(entry);
  return entry;
}

export async function createContext(
  req: CreateContextRequest,
): Promise<ContextLog> {
  await delay();
  const entry: ContextLog = {
    id: ulid(),
    logged_at: new Date().toISOString(),
    stress_score: req.stress_score ?? null,
    sleep_hours: req.sleep_hours ?? null,
    sleep_quality: req.sleep_quality ?? null,
    water_litres: req.water_litres ?? null,
    exercise_type: req.exercise_type ?? null,
    exercise_duration: req.exercise_duration ?? null,
    caffeine_mg: req.caffeine_mg ?? null,
    alcohol_units: req.alcohol_units ?? null,
    medications: req.medications ?? null,
    menstrual_phase: req.menstrual_phase ?? null,
    notes: req.notes ?? null,
  };
  contexts.unshift(entry);
  return entry;
}

export async function createSymptom(
  req: CreateSymptomRequest,
): Promise<SymptomLog> {
  await delay();
  const entry: SymptomLog = {
    id: ulid(),
    logged_at: new Date().toISOString(),
    bloating: req.bloating,
    cramping: req.cramping,
    nausea: req.nausea,
    urgency: req.urgency,
    fatigue: req.fatigue,
    overall: req.overall,
    notes: req.notes ?? null,
  };
  symptoms.unshift(entry);
  return entry;
}

export async function getMeals(): Promise<MealLog[]> {
  await delay();
  return [...meals];
}

export async function getStools(): Promise<StoolLog[]> {
  await delay();
  return [...stools];
}

export async function getContext(): Promise<ContextLog[]> {
  await delay();
  return [...contexts];
}

export async function getSymptoms(): Promise<SymptomLog[]> {
  await delay();
  return [...symptoms];
}

export async function getHypotheses(): Promise<ReviewResponse | null> {
  await delay();
  return hypothesis ? { ...hypothesis } : null;
}

export async function runReview(): Promise<ReviewResponse> {
  await delay();
  await delay(); // extra delay to simulate AI processing
  const result: ReviewResponse = {
    ...seedHypothesis,
    id: ulid(),
    reviewed_at: new Date().toISOString(),
  };
  hypothesis = result;
  return result;
}

export async function scanIngredients(): Promise<ScanResponse> {
  await delay();
  return {
    description: "Pasta with tomato sauce, garlic bread, and side salad",
    ingredients: [
      "pasta",
      "tomato",
      "garlic",
      "olive oil",
      "bread",
      "butter",
      "lettuce",
      "cucumber",
    ],
    fodmap_flags: ["F", "O", "D"],
    fodmap_detail: {
      F: ["garlic", "bread (wheat)"],
      O: ["garlic"],
      D: ["butter"],
    },
    confidence: "high",
    notes:
      "Garlic is a strong fructan source. Wheat bread contains fructans. Butter contains trace lactose.",
  };
}

export async function exportData(
  format: "json" | "csv",
): Promise<{ blob: Blob; filename: string }> {
  await delay();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `ipoop-export-${format}-${date}`;

  if (format === "json") {
    const data = {
      meal_logs: meals,
      stool_logs: stools,
      context_logs: contexts,
      symptom_logs: symptoms,
      hypotheses: hypothesis ? [hypothesis] : [],
    };
    return {
      blob: new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      filename: `${filename}.json`,
    };
  }

  // Simple CSV for mock
  const csv = "id,logged_at,description\n" + meals.map((m) => `${m.id},${m.logged_at},"${m.description}"`).join("\n");
  return {
    blob: new Blob([csv], { type: "text/csv" }),
    filename: `${filename}.csv`,
  };
}
