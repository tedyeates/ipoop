import { handleCors, addCorsHeaders } from "./lib/cors.ts";
import { createErrorResponse } from "./lib/errors.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Route dispatch (to be wired in task 11.1)
    let response: Response;

    if (path === "/api/health" && method === "GET") {
      response = new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      response = createErrorResponse("NOT_FOUND", "Route not found", 404);
    }

    return addCorsHeaders(req, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const response = createErrorResponse("INTERNAL_ERROR", message, 500);
    return addCorsHeaders(req, response);
  }
};

Deno.serve({ port: 8000 }, handler);
