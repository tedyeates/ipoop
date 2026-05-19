import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import fc from "fast-check";
import {
  validateIntRange,
  validateDecimalRange,
  validateString,
  validateEnum,
  validateFodmapFlags,
  hasErrors,
  type ValidationErrors,
} from "../../lib/validate.ts";

// Property 2: Validation rejects out-of-range numeric fields
Deno.test("Property 2: validateIntRange rejects values outside range", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: -1000, max: 1000 }),
      fc.integer({ min: 0, max: 10 }),
      fc.integer({ min: 0, max: 10 }),
      (value, minRaw, maxRaw) => {
        const min = Math.min(minRaw, maxRaw);
        const max = Math.max(minRaw, maxRaw);
        const errors: ValidationErrors = {};
        validateIntRange(value, "field", min, max, errors, true);
        if (value >= min && value <= max) {
          assert(!hasErrors(errors), `Expected no errors for ${value} in [${min}, ${max}]`);
        } else {
          assert(hasErrors(errors), `Expected errors for ${value} outside [${min}, ${max}]`);
        }
      },
    ),
    { numRuns: 200 },
  );
});

Deno.test("Property 2: validateDecimalRange rejects values outside range", () => {
  fc.assert(
    fc.property(
      fc.double({ min: -100, max: 100, noNaN: true }),
      fc.double({ min: 0, max: 50, noNaN: true }),
      fc.double({ min: 0, max: 50, noNaN: true }),
      (value, minRaw, maxRaw) => {
        const min = Math.min(minRaw, maxRaw);
        const max = Math.max(minRaw, maxRaw);
        const errors: ValidationErrors = {};
        validateDecimalRange(value, "field", min, max, errors);
        if (value >= min && value <= max) {
          assert(!hasErrors(errors), `Expected no errors for ${value} in [${min}, ${max}]`);
        } else {
          assert(hasErrors(errors), `Expected errors for ${value} outside [${min}, ${max}]`);
        }
      },
    ),
    { numRuns: 200 },
  );
});

// Property 3: Description length boundary enforcement
Deno.test("Property 3: validateString enforces length boundaries", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 0, maxLength: 600 }),
      (value) => {
        const errors: ValidationErrors = {};
        const result = validateString(value, "description", 1, 500, errors, true);
        const trimmed = value.trim();
        if (trimmed.length >= 1 && trimmed.length <= 500) {
          assert(!hasErrors(errors), `Expected acceptance for length ${trimmed.length}`);
          assertEquals(result, trimmed);
        } else {
          assert(hasErrors(errors) || result === null, `Expected rejection for length ${trimmed.length}`);
        }
      },
    ),
    { numRuns: 200 },
  );
});

// Property 4: Invalid enum values are rejected
Deno.test("Property 4: validateEnum rejects invalid values", () => {
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      (value) => {
        const errors: ValidationErrors = {};
        validateEnum(value, "meal_type", mealTypes, errors);
        if (mealTypes.includes(value as typeof mealTypes[number])) {
          assert(!hasErrors(errors));
        } else {
          assert(hasErrors(errors));
        }
      },
    ),
    { numRuns: 200 },
  );
});

// Property 5: FODMAP flag subset acceptance
Deno.test("Property 5: validateFodmapFlags accepts valid subsets and rejects invalid", () => {
  const validFlags = ["F", "O", "D", "M", "P"];
  fc.assert(
    fc.property(
      fc.subarray(validFlags),
      (subset) => {
        const errors: ValidationErrors = {};
        const result = validateFodmapFlags(subset, "fodmap_flags", errors);
        assert(!hasErrors(errors), `Expected valid subset ${JSON.stringify(subset)} to be accepted`);
        assertEquals(result, subset);
      },
    ),
    { numRuns: 100 },
  );

  fc.assert(
    fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 1, maxLength: 5 }),
      (arr) => {
        const hasInvalid = arr.some((s) => !validFlags.includes(s));
        if (!hasInvalid) return; // skip if accidentally all valid
        const errors: ValidationErrors = {};
        validateFodmapFlags(arr, "fodmap_flags", errors);
        assert(hasErrors(errors), `Expected invalid array ${JSON.stringify(arr)} to be rejected`);
      },
    ),
    { numRuns: 200 },
  );
});
