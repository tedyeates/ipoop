/**
 * Standardised API error response helper.
 * All errors follow a consistent shape per the design doc.
 */

export interface ApiErrorBody {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

/** Create a JSON error Response with consistent shape. */
export function apiError(
  status: number,
  error: string,
  message: string,
  fields?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { error, message };
  if (fields && Object.keys(fields).length > 0) {
    body.fields = fields;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 400 — Validation error with optional per-field details. */
export function validationError(
  message: string,
  fields?: Record<string, string>,
): Response {
  return apiError(400, "VALIDATION_ERROR", message, fields);
}

/** 422 — Structurally valid but semantically wrong. */
export function unprocessableError(message: string): Response {
  return apiError(422, "UNPROCESSABLE", message);
}

/** 500 — Internal server error (no details leaked). */
export function serverError(message = "An internal error occurred"): Response {
  return apiError(500, "SERVER_ERROR", message);
}

/** 503 — Upstream service unavailable. */
export function serviceUnavailable(
  message = "Service temporarily unavailable",
): Response {
  return apiError(503, "SERVICE_UNAVAILABLE", message);
}

/** 504 — Upstream timeout. */
export function timeoutError(message = "Request timed out"): Response {
  return apiError(504, "TIMEOUT", message);
}

/** 404 — Not found. */
export function notFoundError(message = "Not found"): Response {
  return apiError(404, "NOT_FOUND", message);
}

/** 405 — Method not allowed. */
export function methodNotAllowed(message = "Method not allowed"): Response {
  return apiError(405, "METHOD_NOT_ALLOWED", message);
}
