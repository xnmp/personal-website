export function interpolateContent(text: string, fields: Readonly<Record<string, unknown>>, source = "content"): string {
  return text.replace(/\{\{([a-z][a-z0-9_-]*)\}\}/g, (_, field: string) => {
    const value = fields[field];
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`${source}: interpolation "${field}" must be text or a number`);
    }
    return String(value);
  });
}
