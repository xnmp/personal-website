import { interpolateContent } from "../content-template";

export type SourceRange = { start: number; end: number };

type Expansion = {
  source: SourceRange;
  rendered: SourceRange;
};

function assertRange(range: SourceRange, length: number): void {
  if (
    !range ||
    typeof range !== "object" ||
    Array.isArray(range) ||
    !Number.isSafeInteger(range.start) ||
    !Number.isSafeInteger(range.end) ||
    range.start < 0 ||
    range.end < range.start ||
    range.end > length
  ) {
    throw new RangeError("Expected an ordered, in-bounds UTF-16 source range");
  }
}

/** Exact source/interpolated positions of atomic field substitutions. */
export function interpolationRanges(
  source: string,
  fields?: Readonly<Record<string, string | number>>,
): readonly Expansion[] {
  if (typeof source !== "string") throw new TypeError("Source must be text");
  if (fields === undefined) return [];
  const expansions: Expansion[] = [];
  let lengthDifference = 0;
  // Keep the token grammar identical to content-template; the shared interpolator
  // owns value validation and string/number conversion for each matched token.
  for (const match of source.matchAll(/\{\{([a-z][a-z0-9_-]*)\}\}/g)) {
    const start = match.index!;
    const value = interpolateContent(match[0], fields);
    const renderedStart = start - lengthDifference;
    expansions.push({
      source: { start, end: start + match[0].length },
      rendered: { start: renderedStart, end: renderedStart + value.length },
    });
    lengthDifference += match[0].length - value.length;
  }
  return expansions;
}

/**
 * Translate positions in interpolated Markdown back to the authored slot.
 * Omitted fields mean the Markdown was rendered literally, without interpolation.
 * Empty expansions at a boundary belong to the mapped range in full; a zero-width
 * rendered range can therefore represent one or more complete empty placeholders.
 */
export function sourceRange(
  source: string,
  renderedRange: SourceRange,
  fields?: Readonly<Record<string, string | number>>,
): SourceRange {
  if (typeof source !== "string") throw new TypeError("Source must be text");
  if (fields === undefined) {
    assertRange(renderedRange, source.length);
    return { start: renderedRange.start, end: renderedRange.end };
  }

  const expansions = interpolationRanges(source, fields);
  const last = expansions[expansions.length - 1];
  const lengthDifference = last ? last.source.end - last.rendered.end : 0;
  assertRange(renderedRange, source.length - lengthDifference);

  const boundary = (offset: number, side: "start" | "end"): number => {
    let difference = 0;
    let first: number | undefined;
    let last: number | undefined;
    for (const expansion of expansions) {
      const rendered = expansion.rendered;
      if (offset < rendered.start) break;
      if (offset > rendered.start && offset < rendered.end) {
        throw new RangeError(
          "A range boundary cannot split an interpolation value",
        );
      }
      if (offset === rendered.start) {
        first ??= expansion.source.start;
        last = expansion.source.start;
      }
      if (offset === rendered.end) {
        first ??= expansion.source.end;
        last = expansion.source.end;
      }
      if (offset > rendered.end) {
        difference +=
          expansion.source.end -
          expansion.source.start -
          (rendered.end - rendered.start);
      }
    }
    return (side === "start" ? first : last) ?? offset + difference;
  };

  return {
    start: boundary(renderedRange.start, "start"),
    end: boundary(renderedRange.end, "end"),
  };
}

/** Patch only the selected raw Markdown bytes/UTF-16 units; never normalize copy. */
export function replaceSourceRange(
  source: string,
  range: SourceRange,
  replacement: string,
): string {
  if (typeof source !== "string" || typeof replacement !== "string") {
    throw new TypeError("Source and replacement must be text");
  }
  assertRange(range, source.length);
  return source.slice(0, range.start) + replacement + source.slice(range.end);
}
