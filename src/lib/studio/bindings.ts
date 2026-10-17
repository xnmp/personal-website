import { contentBlock, type ContentDocument } from "../content";

/** Serializable identity of an authored source slot. No rendered-text matching. */
export type ContentBinding = {
  documentId: string;
  slotId: string;
  label: string;
  revision: string;
  value: string;
  fields?: Record<string, string | number>;
};

function binding(document: ContentDocument, slotId: string, label: string, value: string): ContentBinding | undefined {
  if (process.env.CONTENT_STUDIO !== "1" || process.env.NODE_ENV !== "development" || process.env.VERCEL || !document.revision) return undefined;
  return {
    documentId: document.source.replace(/^content\//, "").replace(/\.md$/, ""),
    slotId, label, value, revision: document.revision,
  };
}

export function bindField(document: ContentDocument, path: readonly (string | number)[]): ContentBinding | undefined {
  const value = path.reduce<unknown>((current, key) => current != null && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, document.data);
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new Error(`${document.source}: missing scalar ${path.join(".")}`);
  return binding(document, `field:${JSON.stringify(path)}`, path.join(" · "), String(value));
}

/** Spread onto the shared Markdown component. Source syntax stays intact. */
export function bindBlock(document: ContentDocument, name: string) {
  const text = contentBlock(document, name);
  const bound = binding(document, `block:${name}`, name.replace(/-/g, " "), document.blocks[name]);
  if (bound) bound.fields = Object.fromEntries(Object.entries(document.data).filter((entry): entry is [string, string | number] => typeof entry[1] === "string" || typeof entry[1] === "number"));
  return { text, binding: bound };
}
