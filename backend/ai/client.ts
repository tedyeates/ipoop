import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY") || "",
});

export const SCAN_TIMEOUT_MS = 15_000;
export const REVIEW_TIMEOUT_MS = 60_000;

export default anthropic;
