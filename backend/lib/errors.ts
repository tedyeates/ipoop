export interface ApiErrorBody {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

export function createErrorResponse(
  error: string,
  message: string,
  status: number,
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
