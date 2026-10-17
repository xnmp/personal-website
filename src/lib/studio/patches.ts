import { replaceSourceRange, type SourceRange } from "./segments";

export type EmptyContainer = SourceRange & { content: SourceRange };
export type TextPatch = SourceRange & { value: string; containers?: EmptyContainer[] };

const contains = (outer: SourceRange, inner: SourceRange) => outer.start <= inner.start && inner.end <= outer.end;
const apply = (source: string, patches: TextPatch[], offset = 0) => [...patches]
  .sort((a, b) => b.start - a.start)
  .reduce((value, patch) => replaceSourceRange(value, { start: patch.start - offset, end: patch.end - offset }, patch.value), source);

/** Remove a formatting wrapper only after its authored contents have all been deleted. */
export function applyTextPatches(source: string, edits: TextPatch[]): string {
  const containers = [...new Map(edits.flatMap(edit => edit.containers ?? [])
    .map(container => [`${container.start}:${container.end}`, container])).values()]
    .sort((a, b) => (a.end - a.start) - (b.end - b.start));
  const patches = containers.reduce((current, container) => {
    if (current.some(patch => contains(patch, container))) return current;
    const children = current.filter(patch => contains(container.content, patch));
    if (!children.length || apply(source.slice(container.content.start, container.content.end), children, container.content.start).trim()) return current;
    return [...current.filter(patch => !contains(container, patch)), { start: container.start, end: container.end, value: "" }];
  }, edits);
  return apply(source, patches);
}
