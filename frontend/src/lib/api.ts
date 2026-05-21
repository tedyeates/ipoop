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
} from "./types";
import * as mockApi from "../mocks/api";

const useMocks = import.meta.env.VITE_USE_MOCKS !== "false";
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw body;
  }
  return res.json();
}

export async function createMeal(req: CreateMealRequest): Promise<MealLog> {
  if (useMocks) return mockApi.createMeal(req);
  return request("/api/meals", { method: "POST", body: JSON.stringify(req) });
}

export async function createStool(req: CreateStoolRequest): Promise<StoolLog> {
  if (useMocks) return mockApi.createStool(req);
  return request("/api/stools", { method: "POST", body: JSON.stringify(req) });
}

export async function createContext(
  req: CreateContextRequest,
): Promise<ContextLog> {
  if (useMocks) return mockApi.createContext(req);
  return request("/api/context", { method: "POST", body: JSON.stringify(req) });
}

export async function createSymptom(
  req: CreateSymptomRequest,
): Promise<SymptomLog> {
  if (useMocks) return mockApi.createSymptom(req);
  return request("/api/symptoms", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getMeals(): Promise<MealLog[]> {
  if (useMocks) return mockApi.getMeals();
  return request("/api/meals");
}

export async function getStools(): Promise<StoolLog[]> {
  if (useMocks) return mockApi.getStools();
  return request("/api/stools");
}

export async function getContext(): Promise<ContextLog[]> {
  if (useMocks) return mockApi.getContext();
  return request("/api/context");
}

export async function getSymptoms(): Promise<SymptomLog[]> {
  if (useMocks) return mockApi.getSymptoms();
  return request("/api/symptoms");
}

export async function getHypotheses(): Promise<ReviewResponse | null> {
  if (useMocks) return mockApi.getHypotheses();
  return request("/api/hypotheses");
}

export async function runReview(): Promise<ReviewResponse> {
  if (useMocks) return mockApi.runReview();
  return request("/api/review", { method: "POST" });
}

export async function scanIngredients(
  imageBase64: string,
  mimeType: string,
): Promise<ScanResponse> {
  if (useMocks) return mockApi.scanIngredients();
  return request("/api/scan-ingredients", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, mime_type: mimeType }),
  });
}

export async function exportData(
  format: "json" | "csv",
): Promise<{ blob: Blob; filename: string }> {
  if (useMocks) return mockApi.exportData(format);
  const res = await fetch(`${baseUrl}/api/export?format=${format}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const date = new Date().toISOString().slice(0, 10);
  return { blob, filename: `ipoop-export-${format}-${date}` };
}
