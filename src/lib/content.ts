import matter from "gray-matter";

export interface ContentDocument {
  source: string;
  data: Record<string, unknown>;
  body: string;
  blocks: Readonly<Record<string, string>>;
}

/** Markdown stays Markdown; comments identify slots in the existing layouts. */
export function parseContent(source: string, filename = "content"): ContentDocument {
  const language = source.replace(/^\uFEFF/, "").match(/^---([^\r\n]*)/);
  if (language && !["", "yaml", "yml"].includes(language[1].trim())) {
    throw new Error(`${filename}: only YAML frontmatter is supported`);
  }
  const { data, content } = matter(source);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${filename}: frontmatter must be a YAML mapping`);
  }
  const markers = [...content.matchAll(/^<!-- block: ([a-z0-9-]+) -->[ \t]*$/gm)];
  const blocks: Record<string, string> = Object.create(null);
  for (const [i, marker] of markers.entries()) {
    const name = marker[1];
    if (Object.hasOwn(blocks, name)) throw new Error(`${filename}: duplicate block "${name}"`);
    blocks[name] = content.slice(marker.index! + marker[0].length, markers[i + 1]?.index).trim();
  }
  return { source: filename, data, body: content.trim(), blocks };
}

/** Missing copy fails the build at its source instead of publishing a blank. */
export function contentBlock(document: ContentDocument, name: string): string {
  if (!Object.hasOwn(document.blocks, name)) throw new Error(`${document.source}: missing block "${name}"`);
  return document.blocks[name].replace(/\{\{([a-z][a-z0-9_-]*)\}\}/g, (_, field: string) => {
    const value = document.data[field];
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`${document.source}: interpolation "${field}" must be text or a number`);
    }
    return String(value);
  });
}

export function contentField<T>(document: ContentDocument, name: string): T {
  if (!Object.hasOwn(document.data, name)) throw new Error(`${document.source}: missing frontmatter "${name}"`);
  return document.data[name] as T;
}
