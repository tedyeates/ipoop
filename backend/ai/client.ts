/**
 * Anthropic SDK client initialisation.
 * Reads ANTHROPIC_API_KEY from environment.
 * Exports pre-configured timeout values for scan (15s) and review (60s) operations.
 */

import Anthropic from "@anthropic-ai/sdk";

/** Timeout for ingredient scan operations (15 seconds). */
export const SCAN_TIMEOUT_MS = 15_000;

/** Timeout for AI review operations (60 seconds). */
export const REVIEW_TIMEOUT_MS = 60_000;

let _client: Anthropic | null = null;

/** Get or create the Anthropic client singleton. */
export function getAiClient(): Anthropic {
  if (_client) return _client;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable must be set");
  }

  _client = new Anthropic({ apiKey });
  return _client;
}

/** Reset the singleton (useful for tests). */
export function resetAiClient(): void {
  _client = null;
}

/**
 * Replace the singleton with a custom instance (useful for tests).
 * Allows injecting a mocked Anthropic client.
 */
export function setAiClient(client: Anthropic): void {
  _client = client;
}
