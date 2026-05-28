/**
 * Tests for backend/ai/client.ts
 * Verifies timeout constants, singleton behaviour, and error on missing key.
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getAiClient,
  resetAiClient,
  setAiClient,
  SCAN_TIMEOUT_MS,
  REVIEW_TIMEOUT_MS,
} from "../../ai/client.ts";

Deno.test("SCAN_TIMEOUT_MS is 15 seconds", () => {
  assertEquals(SCAN_TIMEOUT_MS, 15_000);
});

Deno.test("REVIEW_TIMEOUT_MS is 60 seconds", () => {
  assertEquals(REVIEW_TIMEOUT_MS, 60_000);
});

Deno.test("getAiClient throws when ANTHROPIC_API_KEY not set", () => {
  resetAiClient();
  const original = Deno.env.get("ANTHROPIC_API_KEY");
  Deno.env.delete("ANTHROPIC_API_KEY");

  try {
    assertThrows(
      () => getAiClient(),
      Error,
      "ANTHROPIC_API_KEY environment variable must be set",
    );
  } finally {
    if (original) Deno.env.set("ANTHROPIC_API_KEY", original);
  }
});

Deno.test("getAiClient returns singleton when key is set", () => {
  resetAiClient();
  Deno.env.set("ANTHROPIC_API_KEY", "test-key-123");

  try {
    const client1 = getAiClient();
    const client2 = getAiClient();
    assertEquals(client1, client2);
  } finally {
    Deno.env.delete("ANTHROPIC_API_KEY");
    resetAiClient();
  }
});

Deno.test("setAiClient replaces singleton", () => {
  resetAiClient();
  // deno-lint-ignore no-explicit-any
  const fakeClient = { fake: true } as any;
  setAiClient(fakeClient);

  Deno.env.set("ANTHROPIC_API_KEY", "test-key-123");
  try {
    const result = getAiClient();
    assertEquals(result, fakeClient);
  } finally {
    Deno.env.delete("ANTHROPIC_API_KEY");
    resetAiClient();
  }
});

Deno.test("resetAiClient clears singleton", () => {
  Deno.env.set("ANTHROPIC_API_KEY", "test-key-abc");
  try {
    const client1 = getAiClient();
    resetAiClient();
    const client2 = getAiClient();
    // After reset, new instance created — not same reference
    assertEquals(client1 !== client2, true);
  } finally {
    Deno.env.delete("ANTHROPIC_API_KEY");
    resetAiClient();
  }
});
