const handler = (_req: Request): Response => {
  return new Response("iPoop API", { status: 200 });
};

Deno.serve({ port: 8000 }, handler);
