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
  const website = data.website === undefined ? undefined : text("website");
  if (website) {
    try {
      const url = new URL(website);
      if (!/^https:\/\//i.test(website) || url.protocol !== "https:" || !url.hostname || url.username || url.password) fail("website");
    } catch { fail("website"); }
  }
  if (typeof data.order !== "number" || !Number.isSafeInteger(data.order) || data.order < 1) fail("order");
  const preview = data.preview as ProjectEntry["preview"];
  if (preview !== undefined && (!preview || typeof preview !== "object"
    || typeof preview.src !== "string" || !/^\/[\w/{\}.-]+\.(?:webp|png|jpg|avif)$/.test(preview.src) || preview.src.includes("..")
    || typeof preview.alt !== "string" || !preview.alt.trim()
    || ![preview.width, preview.height].every((n) => Number.isSafeInteger(n) && n > 0 && n <= 10_000))) fail("preview");
  return {
    slug, glyph, title: text("title"), heading: text("heading"), href: text("href"), repo, website,
    summary: data.summary === undefined ? undefined : text("summary"),
    preview,
    tags: list("tags"), index: text("index"), stats: list("stats"), art,
    status: oneOf("status", ["alpha", "producing", "paused", "complete"]),
    shelf: oneOf("shelf", ["tools", "games"]), tone: oneOf("tone", ["cyan", "rust", "amber", "olive"]),
    order: data.order as number,
  };
}
