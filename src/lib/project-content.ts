import type { ProjectEntry } from "./project";
import type { ContentDocument } from "./content";
import { safeHref } from "./inline";

/** Validate hand-edited metadata before it reaches cards, search or routes. */
export function projectEntry(document: ContentDocument): ProjectEntry & { order: number } {
  const data = document.data;
  const fail = (field: string): never => { throw new Error(`${document.source}: invalid ${field}`); };
  const text = (field: string): string => typeof data[field] === "string" && data[field].trim() ? data[field] : fail(field);
  const list = (field: string): string[] => Array.isArray(data[field]) && data[field].every((v: unknown) => typeof v === "string") ? data[field] : fail(field);
  const oneOf = <T extends string>(field: string, values: readonly T[]): T => values.includes(data[field] as T) ? data[field] as T : fail(field);
  const slug = text("slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("slug");
  if (data.href !== `/p/${slug}`) fail("href (must match slug)");
  const glyph = text("glyph");
  if ([...glyph].length !== 1) fail("glyph (one character required)");
  const art = text("art");
  if (!art.startsWith("/screens/") || art.includes("..")) fail("art");
  const repo = data.repo === undefined ? undefined : text("repo");
  if (repo && (!safeHref(repo) || !repo.startsWith("https://"))) fail("repo");
  if (typeof data.order !== "number" || !Number.isSafeInteger(data.order) || data.order < 1) fail("order");
  return {
    slug, glyph, title: text("title"), heading: text("heading"), href: text("href"), repo,
    tags: list("tags"), index: text("index"), stats: list("stats"), art,
    status: oneOf("status", ["alpha", "producing", "paused", "complete"]),
    shelf: oneOf("shelf", ["tools", "games"]), tone: oneOf("tone", ["cyan", "rust", "amber", "olive"]),
    order: data.order as number,
  };
}
