import { readContent } from "./content.server";
import { abelChapters } from "./abel-notes";

export function readAbelNotes() {
  const content = readContent("abel-ruffini-notes");
  return { content, chapters: abelChapters(content) };
}
