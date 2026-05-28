/**
 * Route handler tests for /api/scan-ingredients.
 * Tests validation, response parsing, and error handling.
 * Mocks only the Anthropic SDK client.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { setAiClient, resetAiClient } from "../../ai/client.ts";
import { handleScan, validateScanResponse } from "../../routes/scan.ts";

// ─── Mock Anthropic client ───────────────────────────────────────────────────

function createMockClient(response: { text: string } | { error: Error }) {
  return {
    messages: {
      create: (_params: unknown, _opts?: unknown) => {
        if ("error" in response) {
          return Promise.reject(response.error);
        }
        return Promise.resolve({
          content: [{ type: "text", text: response.text }],
        });
      },
    },
  } as unknown as import("@anthropic-ai/sdk").default;
}

function createTimeoutClient() {
  return {
    messages: {
      create: (_params: unknown, opts?: { signal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          if (opts?.signal) {
            opts.signal.addEventListener("abort", () => {
              const err = new Error("Request was aborted.");
              err.name = "AbortError";
              reject(err);
            });
          }
        });
      },
    },
  } as unknown as import("@anthropic-ai/sdk").default;
}

const VALID_SCAN_RESPONSE = JSON.stringify({
  description: "Toast with avocado and eggs",
  ingredients: ["bread", "avocado", "eggs", "salt"],
  fodmap_flags: ["F", "P"],
  fodmap_detail: { F: ["bread"], P: ["avocado"] },
  confidence: "high",
  notes: "Avocado is dose-dependent for polyols",
});

// Small valid base64 (1x1 pixel JPEG)
const TINY_IMAGE_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFBABAAAAAAAAAAAAAAAAAAAACf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKgA/9k=";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/scan-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Validation tests ────────────────────────────────────────────────────────

Deno.test("POST /api/scan-ingredients - invalid method → 405", async () => {
  const req = new Request("http://localhost/api/scan-ingredients", { method: "GET" });
  const res = await handleScan(req);
  assertEquals(res.status, 405);
});

Deno.test("POST /api/scan-ingredients - invalid JSON → 400", async () => {
  const req = new Request("http://localhost/api/scan-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json{",
  });
  const res = await handleScan(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.fields._form, "Request body must be valid JSON");
});

Deno.test("POST /api/scan-ingredients - unsupported mime_type → 400", async () => {
  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/bmp",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.fields.mime_type, "string");
});

Deno.test("POST /api/scan-ingredients - missing mime_type → 400", async () => {
  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.fields.mime_type, "string");
});

Deno.test("POST /api/scan-ingredients - missing image_base64 → 400", async () => {
  const res = await handleScan(postRequest({
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.fields.image_base64, "string");
});

Deno.test("POST /api/scan-ingredients - empty image_base64 → 400", async () => {
  const res = await handleScan(postRequest({
    image_base64: "",
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.fields.image_base64, "string");
});

Deno.test("POST /api/scan-ingredients - image too large → 400", async () => {
  // Create base64 string that decodes to > 5MB
  const largeBase64 = "A".repeat(7 * 1024 * 1024); // ~5.25MB decoded
  const res = await handleScan(postRequest({
    image_base64: largeBase64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(typeof body.fields.image_base64, "string");
});

// ─── Valid scan with mocked Claude ───────────────────────────────────────────

Deno.test("POST /api/scan-ingredients - valid image → 200 with parsed response", async () => {
  setAiClient(createMockClient({ text: VALID_SCAN_RESPONSE }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.description, "Toast with avocado and eggs");
  assertEquals(body.ingredients.length, 4);
  assertEquals(body.fodmap_flags, ["F", "P"]);
  assertEquals(body.confidence, "high");

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - Claude returns markdown-wrapped JSON → 200", async () => {
  const wrappedResponse = "```json\n" + VALID_SCAN_RESPONSE + "\n```";
  setAiClient(createMockClient({ text: wrappedResponse }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/png",
  }));
  assertEquals(res.status, 200);

  const body = await res.json();
  assertEquals(body.description, "Toast with avocado and eggs");

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - all valid mime types accepted", async () => {
  const types = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  for (const mimeType of types) {
    setAiClient(createMockClient({ text: VALID_SCAN_RESPONSE }));
    const res = await handleScan(postRequest({
      image_base64: TINY_IMAGE_BASE64,
      mime_type: mimeType,
    }));
    assertEquals(res.status, 200, `Expected 200 for ${mimeType}`);
    resetAiClient();
  }
});

// ─── Error handling ──────────────────────────────────────────────────────────

Deno.test("POST /api/scan-ingredients - Claude timeout → 504", async () => {
  setAiClient(createTimeoutClient());

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 504);

  const body = await res.json();
  assertEquals(body.error, "TIMEOUT");

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - Claude unavailable (503) → 503", async () => {
  const err = new Error("Service unavailable");
  (err as unknown as { status: number }).status = 503;
  setAiClient(createMockClient({ error: err }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 503);

  const body = await res.json();
  assertEquals(body.error, "SERVICE_UNAVAILABLE");

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - Claude overloaded (529) → 503", async () => {
  const err = new Error("Overloaded");
  (err as unknown as { status: number }).status = 529;
  setAiClient(createMockClient({ error: err }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 503);

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - Claude returns invalid JSON → 500", async () => {
  setAiClient(createMockClient({ text: "This is not JSON at all" }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 500);

  const body = await res.json();
  assertEquals(body.error, "SERVER_ERROR");

  resetAiClient();
});

Deno.test("POST /api/scan-ingredients - Claude returns malformed schema → 500", async () => {
  // Valid JSON but missing required fields
  setAiClient(createMockClient({ text: JSON.stringify({ foo: "bar" }) }));

  const res = await handleScan(postRequest({
    image_base64: TINY_IMAGE_BASE64,
    mime_type: "image/jpeg",
  }));
  assertEquals(res.status, 500);

  const body = await res.json();
  assertEquals(body.error, "SERVER_ERROR");

  resetAiClient();
});

// ─── validateScanResponse unit tests ─────────────────────────────────────────

Deno.test("validateScanResponse - valid full response → parsed", () => {
  const input = {
    description: "Pasta with cheese",
    ingredients: ["pasta", "cheese", "tomato"],
    fodmap_flags: ["F", "D"],
    fodmap_detail: { F: ["pasta"], D: ["cheese"] },
    confidence: "medium",
    notes: "Cheese is lactose-dependent",
  };
  const result = validateScanResponse(input);
  assertEquals(result?.description, "Pasta with cheese");
  assertEquals(result?.notes, "Cheese is lactose-dependent");
});

Deno.test("validateScanResponse - valid without notes → parsed", () => {
  const input = {
    description: "Salad",
    ingredients: ["lettuce"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "high",
  };
  const result = validateScanResponse(input);
  assertEquals(result?.description, "Salad");
  assertEquals(result?.notes, undefined);
});

Deno.test("validateScanResponse - missing description → null", () => {
  const input = {
    ingredients: ["bread"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "high",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse - invalid fodmap_flags → null", () => {
  const input = {
    description: "Food",
    ingredients: ["bread"],
    fodmap_flags: ["X"],
    fodmap_detail: {},
    confidence: "high",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse - invalid confidence → null", () => {
  const input = {
    description: "Food",
    ingredients: ["bread"],
    fodmap_flags: [],
    fodmap_detail: {},
    confidence: "very_high",
  };
  assertEquals(validateScanResponse(input), null);
});

Deno.test("validateScanResponse - non-object → null", () => {
  assertEquals(validateScanResponse(null), null);
  assertEquals(validateScanResponse("string"), null);
  assertEquals(validateScanResponse(42), null);
});
