import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCorsHeaders, handlePreflight, applyCors } from "../../lib/cors.ts";

// --- getCorsHeaders ---

Deno.test("getCorsHeaders - returns headers when origin matches CORS_ORIGIN", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const headers = getCorsHeaders("http://localhost:5173");
  assertEquals(headers !== null, true);
  assertEquals(headers!["Access-Control-Allow-Origin"], "http://localhost:5173");
  assertEquals(headers!["Access-Control-Allow-Methods"], "GET, POST, OPTIONS");
  assertEquals(headers!["Access-Control-Allow-Headers"], "Content-Type");
  assertEquals(headers!["Access-Control-Max-Age"], "86400");
});

Deno.test("getCorsHeaders - returns null when origin does not match", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const headers = getCorsHeaders("http://evil.com");
  assertEquals(headers, null);
});

Deno.test("getCorsHeaders - returns null when origin is null", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const headers = getCorsHeaders(null);
  assertEquals(headers, null);
});

Deno.test("getCorsHeaders - returns null when CORS_ORIGIN not set", () => {
  Deno.env.delete("CORS_ORIGIN");
  const headers = getCorsHeaders("http://localhost:5173");
  assertEquals(headers, null);
});

// --- handlePreflight ---

Deno.test("handlePreflight - returns 204 with CORS headers for matching origin", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    method: "OPTIONS",
    headers: { "Origin": "http://localhost:5173" },
  });
  const res = handlePreflight(req);
  assertEquals(res !== null, true);
  assertEquals(res!.status, 204);
  assertEquals(res!.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
  assertEquals(res!.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
  assertEquals(res!.headers.get("Access-Control-Allow-Headers"), "Content-Type");
  assertEquals(res!.headers.get("Access-Control-Max-Age"), "86400");
});

Deno.test("handlePreflight - returns 403 for non-matching origin", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    method: "OPTIONS",
    headers: { "Origin": "http://evil.com" },
  });
  const res = handlePreflight(req);
  assertEquals(res !== null, true);
  assertEquals(res!.status, 403);
});

Deno.test("handlePreflight - returns 403 when no Origin header", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    method: "OPTIONS",
  });
  const res = handlePreflight(req);
  assertEquals(res !== null, true);
  assertEquals(res!.status, 403);
});

// --- applyCors ---

Deno.test("applyCors - adds CORS headers to response for matching origin", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    headers: { "Origin": "http://localhost:5173" },
  });
  const original = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  const res = applyCors(req, original);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
  assertEquals(res.headers.get("Content-Type"), "application/json");
});

Deno.test("applyCors - returns 403 for non-matching origin", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    headers: { "Origin": "http://evil.com" },
  });
  const original = new Response("ok", { status: 200 });
  const res = applyCors(req, original);
  assertEquals(res.status, 403);
});

Deno.test("applyCors - passes through when no Origin header (same-origin)", () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals");
  const original = new Response("ok", { status: 200 });
  const res = applyCors(req, original);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("applyCors - preserves original response body", async () => {
  Deno.env.set("CORS_ORIGIN", "http://localhost:5173");
  const req = new Request("http://localhost:8000/api/meals", {
    headers: { "Origin": "http://localhost:5173" },
  });
  const body = JSON.stringify({ id: "abc", name: "test" });
  const original = new Response(body, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
  const res = applyCors(req, original);
  assertEquals(res.status, 201);
  const text = await res.text();
  assertEquals(text, body);
});
