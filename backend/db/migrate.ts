/**
 * Database migration script.
 * Reads schema.sql and applies it to the configured database.
 * Works for both local SQLite and remote Turso.
 *
 * Usage: deno run --allow-net --allow-env --allow-read --allow-write backend/db/migrate.ts
 */

import { type Client } from "@libsql/client";
import { getDb } from "./client.ts";

/** Read schema.sql from disk. */
async function readSchema(): Promise<string> {
  const schemaPath = new URL("./schema.sql", import.meta.url);
  return await Deno.readTextFile(schemaPath);
}

/**
 * Apply schema SQL to a database client.
 * Strips comment-only lines, splits on semicolons, and executes each statement.
 */
export async function applySchema(client: Client): Promise<void> {
  const schema = await readSchema();

  // Remove full-line comments before splitting
  const cleaned = schema
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
}

// Run migration when executed directly
if (import.meta.main) {
  const db = getDb();
  await applySchema(db);
  console.log("Schema applied successfully.");
}
