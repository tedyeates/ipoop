import { createClient } from "@libsql/client";

const client = createClient({
  url: Deno.env.get("TURSO_DATABASE_URL") || "",
  authToken: Deno.env.get("TURSO_AUTH_TOKEN") || "",
});

export default client;
