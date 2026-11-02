import { contentBlock, contentField, type ContentDocument } from "./content";

export type AbelChapter = { id: string; title: string; summary: string };

/** Chapter URLs must stay unique and point to an authored body. */
export function abelChapters(content: ContentDocument): AbelChapter[] {
  const chapters = contentField<unknown>(content, "chapters");
  if (!Array.isArray(chapters) || !chapters.length)
    throw new Error(`${content.source}: chapters must be a nonempty list`);
  const ids = new Set<string>();
  return chapters.map((chapter: unknown) => {
    const value = chapter as Partial<AbelChapter> | null;
    if (!value || typeof value.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)
      || ids.has(value.id) || typeof value.title !== "string" || !value.title.trim()
      || typeof value.summary !== "string" || !value.summary.trim())
      throw new Error(`${content.source}: invalid or duplicate chapter`);
    ids.add(value.id);
    contentBlock(content, value.id);
    return { id: value.id, title: value.title, summary: value.summary };
  });
}
