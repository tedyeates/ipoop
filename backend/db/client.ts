/**
 * Database client initialisation.
 * Connects to local SQLite file in development or Turso in production.
 * Toggle via DATABASE_MODE env var: "local" (default) or "turso".
 */

import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

/** Get or create the database client singleton. */
export function getDb(): Client {
  if (_client) return _client;

  const mode = Deno.env.get("DATABASE_MODE") ?? "local";

  if (mode === "turso") {
    const url = Deno.env.get("TURSO_DATABASE_URL");
    const authToken = Deno.env.get("TURSO_AUTH_TOKEN");

    if (!url || !authToken) {
      throw new Error(
        "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set when DATABASE_MODE=turso",
      );
    }

    _client = createClient({ url, authToken });
  } else {
    // Local SQLite file for development
    const localPath = Deno.env.get("LOCAL_DB_PATH") ?? "data/local.db";
    _client = createClient({ url: `file:${localPath}` });
  }

  return _client;
}

/**
 * Create a fresh client for testing (not singleton).
 * Accepts a file path so each test can use an isolated DB.
 */
export function createTestDb(filePath: string): Client {
  return createClient({ url: `file:${filePath}` });
}

/** Reset the singleton (useful for tests). */
export function resetDb(): void {
  _client = null;
}
