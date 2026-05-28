import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateUlid, nowISO } from "../../lib/ulid.ts";

// --- ULID format ---

Deno.test("generateUlid - returns 26 character string", () => {
  const id = generateUlid();
  assertEquals(id.length, 26);
});

Deno.test("generateUlid - uses only Crockford Base32 characters", () => {
  const CROCKFORD_BASE32 = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;
  const id = generateUlid();
  assertEquals(CROCKFORD_BASE32.test(id), true, `ULID "${id}" contains invalid chars`);
});

Deno.test("generateUlid - multiple ULIDs all match Crockford Base32", () => {
  const CROCKFORD_BASE32 = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;
  for (let i = 0; i < 50; i++) {
    const id = generateUlid();
    assertEquals(CROCKFORD_BASE32.test(id), true, `ULID "${id}" contains invalid chars`);
  }
});

Deno.test("generateUlid - lexicographically sortable (later > earlier)", () => {
  const first = generateUlid();
  // Small delay to ensure different timestamp component
  const start = Date.now();
  while (Date.now() - start < 2) { /* spin */ }
  const second = generateUlid();
  assertEquals(second > first, true, `Expected "${second}" > "${first}"`);
});

// --- ULID uniqueness ---

Deno.test("generateUlid - 1000 generated ULIDs are all distinct", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    ids.add(generateUlid());
  }
  assertEquals(ids.size, 1000);
});

// --- nowISO ---

Deno.test("nowISO - returns valid ISO8601 string", () => {
  const ts = nowISO();
  const parsed = new Date(ts);
  assertEquals(isNaN(parsed.getTime()), false, `"${ts}" is not valid ISO8601`);
});

Deno.test("nowISO - timestamp is close to current time", () => {
  const before = Date.now();
  const ts = nowISO();
  const after = Date.now();
  const parsed = new Date(ts).getTime();
  assertEquals(parsed >= before && parsed <= after, true);
});
