export const SCAN_SYSTEM_PROMPT = `You are a food ingredient analyser. Given a photo of a meal, identify the visible ingredients and classify them by FODMAP category.

Respond ONLY with valid JSON matching this exact schema:
{
  "description": "Brief description of the meal",
  "ingredients": ["ingredient1", "ingredient2"],
  "fodmap_flags": ["F", "O", "D", "M", "P"],
  "fodmap_detail": {"F": ["ingredient1"], "D": ["ingredient2"]},
  "confidence": "high" | "medium" | "low",
  "notes": "Optional notes about dose-dependency or uncertainty"
}

Rules:
- fodmap_flags: only include categories where at least one ingredient is a known trigger
- fodmap_detail: map each flagged category to the specific ingredients that trigger it
- confidence: "high" if food is clearly visible and identifiable, "medium" if partially obscured, "low" if uncertain
- Be conservative: flag borderline/dose-dependent items with a note explaining the dose-dependency rather than omitting them
- If no food is identifiable, respond with: {"error": "no_food_detected"}
- Do NOT include any text outside the JSON object`;

export interface ScanResponse {
  description: string;
  ingredients: string[];
  fodmap_flags: ("F" | "O" | "D" | "M" | "P")[];
  fodmap_detail: Record<string, string[]>;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

const VALID_FODMAP = new Set(["F", "O", "D", "M", "P"]);
const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

export function parseScanResponse(raw: string): ScanResponse | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Failed to parse AI response" };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.error === "no_food_detected") {
    return { error: "Could not identify food items in the image" };
  }

  if (typeof obj.description !== "string" || !obj.description) {
    return { error: "Invalid AI response: missing description" };
  }
  if (!Array.isArray(obj.ingredients)) {
    return { error: "Invalid AI response: missing ingredients" };
  }
  if (!Array.isArray(obj.fodmap_flags) || !obj.fodmap_flags.every((f: unknown) => VALID_FODMAP.has(f as string))) {
    return { error: "Invalid AI response: invalid fodmap_flags" };
  }
  if (!VALID_CONFIDENCE.has(obj.confidence as string)) {
    return { error: "Invalid AI response: invalid confidence" };
  }

  return {
    description: obj.description,
    ingredients: obj.ingredients as string[],
    fodmap_flags: obj.fodmap_flags as ScanResponse["fodmap_flags"],
    fodmap_detail: (obj.fodmap_detail as Record<string, string[]>) || {},
    confidence: obj.confidence as ScanResponse["confidence"],
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}
