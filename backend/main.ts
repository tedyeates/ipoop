/**
 * iPoop API — Deno Deploy entry point.
 * Single entry point with URL-based routing to route handler modules.
 */

import { handlePreflight, applyCors } from "./lib/cors.ts";
import { notFoundError, methodNotAllowed } from "./lib/errors.ts";

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

  // API routes — will be wired up in subsequent tasks
  if (path === "/api/meals") {
    return methodNotAllowed("Meal routes not yet implemented");
  }

  if (path === "/api/stools") {
    return methodNotAllowed("Stool routes not yet implemented");
  }

  if (path === "/api/context") {
    return methodNotAllowed("Context routes not yet implemented");
  }

  if (path === "/api/symptoms") {
    return methodNotAllowed("Symptom routes not yet implemented");
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
