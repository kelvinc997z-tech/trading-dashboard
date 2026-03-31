/**
 * Parse a JSON string safely, returning default if invalid
 */
export function safeJsonParse<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert a value to JSON string safely
 */
export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[]";
  }
}
