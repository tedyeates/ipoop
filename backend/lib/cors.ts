const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") || "";

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}

export function addCorsHeaders(req: Request, response: Response): Response {
  const origin = req.headers.get("Origin") || "";
  if (origin && origin !== CORS_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(getCorsHeadersMap(req))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getCorsHeaders(req: Request): HeadersInit {
  return getCorsHeadersMap(req);
}

function getCorsHeadersMap(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  if (!origin || origin !== CORS_ORIGIN) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
