// Shared TypeScript interfaces matching API contracts

export interface MealLog {
  id: string;
  logged_at: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  description: string;
  fodmap_flags: ("F" | "O" | "D" | "M" | "P")[];
  ingredients: string[];
  fodmap_detail: Record<string, string[]>;
  portion_size: "small" | "medium" | "large" | null;
  eating_speed: "slow" | "normal" | "fast" | null;
  scan_used: number;
}

export interface CreateMealRequest {
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  fodmap_flags?: ("F" | "O" | "D" | "M" | "P")[];
  ingredients?: string[];
  fodmap_detail?: Record<string, string[]>;
  portion_size?: "small" | "medium" | "large";
  eating_speed?: "slow" | "normal" | "fast";
  scan_used?: boolean;
}

export interface StoolLog {
  id: string;
  logged_at: string;
  bristol_type: number;
  frequency: number | null;
  urgency: number | null;
  pain_score: number | null;
  blood: number | null;
  notes: string | null;
}

export interface CreateStoolRequest {
  bristol_type: number;
  frequency?: number;
  urgency?: boolean;
  pain_score?: number;
  blood?: boolean;
  notes?: string;
}

export interface ContextLog {
  id: string;
  logged_at: string;
  stress_score: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  water_litres: number | null;
  exercise_type: "none" | "walk" | "gym" | "run" | "other" | null;
  exercise_duration: number | null;
  caffeine_mg: number | null;
  alcohol_units: number | null;
  medications: string | null;
  menstrual_phase:
    | "follicular"
    | "ovulatory"
    | "luteal"
    | "menstrual"
    | "n/a"
    | null;
  notes: string | null;
}

export interface CreateContextRequest {
  stress_score?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  water_litres?: number;
  exercise_type?: "none" | "walk" | "gym" | "run" | "other";
  exercise_duration?: number;
  caffeine_mg?: number;
  alcohol_units?: number;
  medications?: string;
  menstrual_phase?: "follicular" | "ovulatory" | "luteal" | "menstrual" | "n/a";
  notes?: string;
}

export interface SymptomLog {
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

export interface CreateSymptomRequest {
  bloating: number;
  cramping: number;
  nausea: number;
  urgency: number;
  fatigue: number;
  overall: number;
  notes?: string;
}

export interface ScanResponse {
  description: string;
  ingredients: string[];
  fodmap_flags: ("F" | "O" | "D" | "M" | "P")[];
  fodmap_detail: Record<string, string[]>;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

export type ConfidenceLabel = "Low" | "Moderate" | "High" | "Very High";

export interface Hypothesis {
  trigger_name: string;
  fodmap_category: string;
  confidence_score: number;
  confidence_label: ConfidenceLabel;
  direction: "worsens" | "improves" | "unclear";
  symptom_pattern: string;
  supporting_events: number;
  contradicting_events: number;
  notes?: string;
}

export interface ReviewResponse {
  id: string;
  reviewed_at: string;
  summary: string;
  days_analysed: number;
  entries_analysed: number;
  hypotheses: Hypothesis[];
}

export interface ApiError {
  error: string;
  message: string;
  fields?: Record<string, string>;
}
