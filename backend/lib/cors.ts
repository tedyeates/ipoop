/**
 * CORS middleware — reads allowed origin from CORS_ORIGIN env var.
 * Returns appropriate CORS headers for allowed origins.
 * Rejects requests from disallowed origins (returns 403).
 */

const CORS_HEADERS_BASE = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Get the configured allowed origin. */
function getAllowedOrigin(): string {
  return Deno.env.get("CORS_ORIGIN") ?? "";
}

/** Build CORS headers for a given origin. Returns null if origin not allowed. */
export function getCorsHeaders(
  requestOrigin: string | null,
): Record<string, string> | null {
  const allowed = getAllowedOrigin();
  if (!allowed) return null;
  if (!requestOrigin) return null;
  if (requestOrigin !== allowed) return null;

  return {
    ...CORS_HEADERS_BASE,
    "Access-Control-Allow-Origin": allowed,
  };
}

/** Handle preflight OPTIONS request. Returns Response or null if origin disallowed. */
export function handlePreflight(req: Request): Response | null {
  const origin = req.headers.get("Origin");
  const headers = getCorsHeaders(origin);

  if (!headers) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, { status: 204, headers });
}

/**
 * Apply CORS headers to a response. If origin is disallowed, returns 403.
 * If no Origin header present (same-origin or non-browser), passes through.
 */
export function applyCors(req: Request, res: Response): Response {
  const origin = req.headers.get("Origin");

  // No Origin header = same-origin request or non-browser client, pass through
  if (!origin) return res;

  const corsHeaders = getCorsHeaders(origin);
  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }

  // Clone response with CORS headers added
  const newHeaders = new Headers(res.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}
