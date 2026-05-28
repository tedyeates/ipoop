/**
 * ULID generation utility.
 * Uses Deno standard library for ULID generation.
 * All primary keys in the system are ULIDs.
 */

import { ulid } from "@std/ulid";

/** Generate a new ULID. */
export function generateUlid(): string {
  return ulid();
}

/** Generate an ISO8601 timestamp for the current moment. */
export function nowISO(): string {
  return new Date().toISOString();
}
