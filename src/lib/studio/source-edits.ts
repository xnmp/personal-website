import { replaceSourceRange, type SourceRange } from "./segments";

export type SourceEdit = SourceRange & { value: string };

/** Block coordinates stay fixed for an editing session, even when a block is empty. */
export function editSource(source: string, edits: readonly SourceEdit[]): string {
  const ordered = [...edits].sort((a, b) => b.start - a.start);
  let boundary = source.length;
  for (const edit of ordered) {
    if (edit.end > boundary) throw new RangeError("Source edits must not overlap");
    boundary = edit.start;
  }
  return ordered.reduce((value, edit) => replaceSourceRange(value, edit, edit.value), source);
}
