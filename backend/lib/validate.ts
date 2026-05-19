export type ValidationErrors = Record<string, string>;

export function validateIntRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: ValidationErrors,
  required = false,
): number | null {
  if (value === undefined || value === null) {
    if (required) errors[field] = `${field} is required`;
    return null;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    errors[field] = `${field} must be an integer between ${min} and ${max}`;
    return null;
  }
  return n;
}

export function validateDecimalRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: ValidationErrors,
): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  if (isNaN(n) || n < min || n > max) {
    errors[field] = `${field} must be a number between ${min} and ${max}`;
    return null;
  }
  return n;
}

export function validateString(
  value: unknown,
  field: string,
  minLen: number,
  maxLen: number,
  errors: ValidationErrors,
  required = false,
): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) errors[field] = `${field} is required`;
    return null;
  }
  const s = String(value).trim();
  if (s.length < minLen || s.length > maxLen) {
    errors[field] = `${field} must be between ${minLen} and ${maxLen} characters`;
    return null;
  }
  return s;
}

export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  errors: ValidationErrors,
): T | null {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(value as T)) {
    errors[field] = `${field} must be one of: ${allowed.join(", ")}`;
    return null;
  }
  return value as T;
}

export function validateBoolean(
  value: unknown,
  field: string,
  errors: ValidationErrors,
): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === 0 || value === 1) return value;
  errors[field] = `${field} must be a boolean`;
  return null;
}

const VALID_FODMAP = ["F", "O", "D", "M", "P"] as const;

export function validateFodmapFlags(
  value: unknown,
  field: string,
  errors: ValidationErrors,
): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors[field] = `${field} must be an array`;
    return null;
  }
  for (const item of value) {
    if (!VALID_FODMAP.includes(item as typeof VALID_FODMAP[number])) {
      errors[field] = `${field} must only contain values from: F, O, D, M, P`;
      return null;
    }
  }
  return value as string[];
}

export function validateIngredients(
  value: unknown,
  field: string,
  errors: ValidationErrors,
): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors[field] = `${field} must be an array`;
    return null;
  }
  if (value.length > 50) {
    errors[field] = `${field} must contain at most 50 items`;
    return null;
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== "string" || value[i].length > 100) {
      errors[field] = `${field}[${i}] must be a string of at most 100 characters`;
      return null;
    }
  }
  return value as string[];
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
