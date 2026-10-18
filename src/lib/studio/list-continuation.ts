/** The single native edit for Enter in an unordered Markdown list. */
export function listEnterEdit(source: string, start: number, end = start) {
  // Leave selected text and malformed ranges to the textarea's normal behavior.
  if (!Number.isInteger(start) || start < 0 || start > source.length || end !== start) return null;
  const lineStart = start === 0 ? 0 : source.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = source.indexOf("\n", start);
  const lineEnd = nextBreak < 0 ? source.length : nextBreak;
  const line = source.slice(lineStart, lineEnd);
  const prefix = line.match(/^[\t ]*[-*](?:[\t ]+|$)/)?.[0];
  if (!prefix || start < lineStart + prefix.length) return null;
  // A blank line ends a Markdown list; a single newline would keep prose in it.
  return line.slice(prefix.length).trim() === ""
    ? { start: lineStart, end: lineEnd, text: "\n" }
    : { start, end, text: `\n${prefix}` };
}
