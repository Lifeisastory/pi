export function parseJsonObject(
  text: string,
  sourceName: string,
): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON in ${sourceName}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Expected JSON object in ${sourceName}`);
  }

  return parsed as Record<string, unknown>;
}

export function readOptionalString(object: Record<string, unknown>, key: string, sourceName: string): string | undefined {
  const value = object[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Expected string for ${key} in ${sourceName}`);
  }

  return value;
}
