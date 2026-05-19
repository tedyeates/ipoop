export type ConfidenceLabel = "Low" | "Moderate" | "High" | "Very High";

export function getConfidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.85) return "Very High";
  if (score >= 0.65) return "High";
  if (score >= 0.40) return "Moderate";
  return "Low";
}

export function applyDataSufficiencyCap(score: number, daysOfData: number): number {
  if (daysOfData < 7) return Math.min(score, 0.39);
  if (daysOfData < 14) return Math.min(score, 0.64);
  return score;
}

export function applySupportingEventsCap(score: number, supportingEvents: number): number {
  if (supportingEvents < 3) return Math.min(score, 0.50);
  return score;
}

export function applyConfounderReduction(
  score: number,
  hasConfounders: boolean,
): number {
  if (hasConfounders) return Math.max(0, score - 0.15);
  return score;
}

export interface ConfidenceContext {
  rawScore: number;
  daysOfData: number;
  supportingEvents: number;
  hasConfounders: boolean;
}

export function computeFinalConfidence(ctx: ConfidenceContext): {
  score: number;
  label: ConfidenceLabel;
} {
  let score = ctx.rawScore;
  score = applyConfounderReduction(score, ctx.hasConfounders);
  score = applySupportingEventsCap(score, ctx.supportingEvents);
  score = applyDataSufficiencyCap(score, ctx.daysOfData);
  score = Math.min(score, 0.95);
  score = Math.round(score * 100) / 100;
  return { score, label: getConfidenceLabel(score) };
}
