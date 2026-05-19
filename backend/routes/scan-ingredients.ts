import { createErrorResponse } from "../lib/errors.ts";
import anthropic, { SCAN_TIMEOUT_MS } from "../ai/client.ts";
import { SCAN_SYSTEM_PROMPT, parseScanResponse } from "../ai/scan-prompt.ts";

const VALID_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function handleScanIngredients(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return createErrorResponse("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const data = body as Record<string, unknown>;

  if (!data.mime_type || !VALID_MIME_TYPES.has(data.mime_type as string)) {
    return createErrorResponse("VALIDATION_ERROR", "Unsupported image type. Accepted: JPEG, PNG, GIF, WebP", 422, {
      mime_type: "Must be one of: image/jpeg, image/png, image/gif, image/webp",
    });
  }

  if (typeof data.image_base64 !== "string" || !data.image_base64) {
    return createErrorResponse("VALIDATION_ERROR", "image_base64 is required", 400, {
      image_base64: "image_base64 is required",
    });
  }

  // Check decoded size
  const decodedSize = Math.ceil((data.image_base64 as string).length * 3 / 4);
  if (decodedSize > MAX_IMAGE_BYTES) {
    return createErrorResponse("VALIDATION_ERROR", "Image exceeds 5MB size limit", 400, {
      image_base64: "Image must be 5MB or less",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: SCAN_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [{
          type: "image",
          source: {
            type: "base64",
            media_type: data.mime_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: data.image_base64 as string,
          },
        }, {
          type: "text",
          text: "Identify the ingredients in this meal and classify by FODMAP category.",
        }],
      }],
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("AI_ERROR", "No text response from AI", 503);
    }

    const result = parseScanResponse(textBlock.text);
    if ("error" in result) {
      return createErrorResponse("AI_ERROR", result.error, 422);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return createErrorResponse("TIMEOUT", "Scan service timed out. Please try again.", 504);
    }
    return createErrorResponse("SERVICE_UNAVAILABLE", "Scan service is temporarily unavailable", 503);
  }
}
