import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import fc from "fast-check";
import { generateUlid, generateTimestamp } from "../../lib/ulid.ts";

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// Property 14: All generated IDs are valid ULIDs and all timestamps are valid ISO8601
Deno.test("Property 14: generateUlid produces valid ULID format", () => {
  fc.assert(
    fc.property(
      fc.constant(null),
      () => {
        const ulid = generateUlid();
        assert(ULID_REGEX.test(ulid), `ULID ${ulid} does not match Crockford Base32 format`);
        assert(ulid.length === 26, `ULID length is ${ulid.length}, expected 26`);
      },
    ),
    { numRuns: 200 },
  );
});

Deno.test("Property 14: generateTimestamp produces valid ISO8601", () => {
  fc.assert(
    fc.property(
      fc.constant(null),
      () => {
        const ts = generateTimestamp();
        const parsed = new Date(ts);
        assert(!isNaN(parsed.getTime()), `Timestamp ${ts} is not valid ISO8601`);
        assert(ts.endsWith("Z"), `Timestamp ${ts} should end with Z`);
      },
    ),
    { numRuns: 100 },
  );
});
