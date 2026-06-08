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
