/**
 * iPoop API — Deno Deploy entry point.
 * Single entry point with URL-based routing to route handler modules.
 */

import { handlePreflight, applyCors } from "./lib/cors.ts";
import { notFoundError, methodNotAllowed } from "./lib/errors.ts";
import { handleMeals } from "./routes/meals.ts";
import { handleStools } from "./routes/stools.ts";
import { handleContext } from "./routes/context.ts";
import { handleSymptoms } from "./routes/symptoms.ts";

/** Route a request to the appropriate handler based on URL path. */
async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Health check
  if (path === "/health" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // API routes
  if (path === "/api/meals") {
    return handleMeals(req);
  }

  if (path === "/api/stools") {
    return handleStools(req);
  }

  if (path === "/api/context") {
    return handleContext(req);
  }

  if (path === "/api/symptoms") {
    return handleSymptoms(req);
  }

  if (path === "/api/scan-ingredients") {
    return methodNotAllowed("Scan routes not yet implemented");
  }

  if (path === "/api/review") {
    return methodNotAllowed("Review routes not yet implemented");
  }

  if (path === "/api/hypotheses") {
    return methodNotAllowed("Hypotheses routes not yet implemented");
  }

  if (path === "/api/export") {
    return methodNotAllowed("Export routes not yet implemented");
  }

  if (path === "/api/dashboard") {
    return methodNotAllowed("Dashboard routes not yet implemented");
  }

  return notFoundError(`No route for ${path}`);
}

/** Main request handler — applies CORS then routes. */
async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const preflight = handlePreflight(req);
    if (preflight) return preflight;
    return new Response(null, { status: 204 });
  }

  // Route the request
  const response = await route(req);

  // Apply CORS headers to response
  return applyCors(req, response);
}

Deno.serve({ port: 8000 }, handler);
