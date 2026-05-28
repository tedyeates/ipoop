/**
 * Ingredient scan route handler.
 * POST /api/scan-ingredients — send food photo to Claude vision, return structured ingredients.
 */

import { getAiClient, SCAN_TIMEOUT_MS } from "../ai/client.ts";
import {
  methodNotAllowed,
  validationError,
  serviceUnavailable,
  timeoutError,
  serverError,
} from "../lib/errors.ts";

/** Allowed image MIME types. */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/** Maximum image size in bytes (5MB). */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Expected shape of Claude's structured scan response. */
export interface ScanResponse {
  description: string;
  ingredients: string[];
  fodmap_flags: string[];
  fodmap_detail: Record<string, string[]>;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

/** Validate parsed JSON conforms to ScanResponse schema. */
export function validateScanResponse(data: unknown): ScanResponse | null {
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;

  if (typeof obj.description !== "string") return null;
  if (!Array.isArray(obj.ingredients)) return null;
  if (!obj.ingredients.every((i: unknown) => typeof i === "string")) return null;
  if (!Array.isArray(obj.fodmap_flags)) return null;

  const validFlags = new Set(["F", "O", "D", "M", "P"]);
  if (!obj.fodmap_flags.every((f: unknown) => typeof f === "string" && validFlags.has(f))) return null;

  if (typeof obj.fodmap_detail !== "object" || obj.fodmap_detail === null || Array.isArray(obj.fodmap_detail)) return null;
  const detail = obj.fodmap_detail as Record<string, unknown>;
  for (const val of Object.values(detail)) {
    if (!Array.isArray(val)) return null;
    if (!val.every((v: unknown) => typeof v === "string")) return null;
  }

  if (!["high", "medium", "low"].includes(obj.confidence as string)) return null;

  if (obj.notes !== undefined && typeof obj.notes !== "string") return null;

  return {
    description: obj.description as string,
    ingredients: obj.ingredients as string[],
    fodmap_flags: obj.fodmap_flags as string[],
    fodmap_detail: obj.fodmap_detail as Record<string, string[]>,
    confidence: obj.confidence as "high" | "medium" | "low",
    ...(obj.notes !== undefined ? { notes: obj.notes as string } : {}),
  };
}

export async function handleScan(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return methodNotAllowed(`Method ${req.method} not allowed on /api/scan-ingredients`);
  }

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body", { _form: "Request body must be valid JSON" });
  }

  // Validate mime_type
  const mimeType = body.mime_type;
  if (typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return validationError("Unsupported image type", {
      mime_type: "Accepted formats: JPEG, PNG, GIF, WebP",
    });
  }

  // Validate image_base64
  const imageBase64 = body.image_base64;
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return validationError("Image data required", {
      image_base64: "Base64-encoded image data is required",
    });
  }

  // Check decoded size (base64 is ~4/3 of original size)
  const estimatedBytes = Math.ceil(imageBase64.length * 3 / 4);
  if (estimatedBytes > MAX_IMAGE_SIZE) {
    return validationError("Image too large", {
      image_base64: "Image must be 5MB or less",
    });
  }

  // Send to Claude vision API
  let responseText: string;
  try {
    const client = getAiClient();

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), SCAN_TIMEOUT_MS);

    try {
      const message = await client.messages.create(
        {
          model: "claude-haiku-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                    data: imageBase64,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this food image and identify all visible ingredients. For each ingredient, determine which FODMAP categories it belongs to (F=Fructans, O=Oligosaccharides/GOS, D=Disaccharides/Lactose, M=Monosaccharides/Fructose, P=Polyols).

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "description": "brief description of the meal",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "fodmap_flags": ["F", "O", "D", "M", "P"],
  "fodmap_detail": {"F": ["ingredient triggering F"], "O": ["ingredient triggering O"], ...},
  "confidence": "high" | "medium" | "low",
  "notes": "optional notes about dose-dependency or uncertainty"
}

Rules:
- Only include FODMAP flags that are actually triggered by identified ingredients
- Be conservative: flag borderline items with a note about dose-dependency
- If no food is identifiable, return: {"description": "Unable to identify food items", "ingredients": [], "fodmap_flags": [], "fodmap_detail": {}, "confidence": "low", "notes": "Could not identify food items in image"}
- confidence should be "high" if ingredients are clearly visible, "medium" if some are uncertain, "low" if image is unclear`,
                },
              ],
            },
          ],
        },
        { signal: abortController.signal },
      );

      clearTimeout(timeoutId);

      // Extract text from response
      const textBlock = message.content.find((b) => b.type === "text");
      responseText = textBlock ? textBlock.text : "";
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err: unknown) {
    // Check for timeout (abort)
    if (err instanceof Error && err.name === "AbortError") {
      return timeoutError("Ingredient scan timed out");
    }

    // Check for API errors indicating service unavailable
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (
        msg.includes("overloaded") ||
        msg.includes("unavailable") ||
        msg.includes("529") ||
        msg.includes("503") ||
        msg.includes("connection")
      ) {
        return serviceUnavailable("AI scan service temporarily unavailable");
      }
    }

    // Check for status-based errors from Anthropic SDK
    if (typeof err === "object" && err !== null && "status" in err) {
      const status = (err as { status: number }).status;
      if (status === 529 || status === 503) {
        return serviceUnavailable("AI scan service temporarily unavailable");
      }
      if (status === 408 || status === 504) {
        return timeoutError("Ingredient scan timed out");
      }
    }

    console.error("Scan AI error:", err);
    return serviceUnavailable("AI scan service temporarily unavailable");
  }

  // Parse Claude's response
  let parsed: unknown;
  try {
    // Strip markdown code fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse scan response as JSON:", responseText);
    return serverError("Failed to parse AI response");
  }

  // Validate against ScanResponse schema
  const scanResult = validateScanResponse(parsed);
  if (!scanResult) {
    console.error("Scan response failed schema validation:", parsed);
    return serverError("AI response did not match expected format");
  }

  return new Response(JSON.stringify(scanResult), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
