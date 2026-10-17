/** Encode visible text for an ordinary Markdown text leaf, without changing its surrounding markup. */
export function markdownText(value: string): string {
  assertText(value, "Text");
  const normalized = value.replace(/\r\n?/g, "\n");
  const encoded = normalized.split("\n").map(escapeLine).join("\\\n");
  // A final hard break needs a following token. The renderer trims this ordinary
  // whitespace entity, keeping the break without adding a visible character.
  return normalized.endsWith("\n") ? `${encoded}&#32;` : encoded;
}

function assertText(value: string, label: string): void {
  if (typeof value !== "string")
    throw new TypeError(`${label} must be a string`);
  if (value.includes("\0"))
    throw new Error(`${label} cannot contain NUL characters`);
}

function escapeLine(line: string): string {
  const leading = line.match(/^[ \t]*/)?.[0].length ?? 0;
  const trailing = line.length - (line.match(/[ \t]*$/)?.[0].length ?? 0);
  const start = line.slice(leading);
  const markerPositions = new Set<number>();
  if (
    /^[#>]/.test(start) ||
    /^[+-](?:[ \t]|$)/.test(start) ||
    /^(?:-[ \t]*){3,}$/.test(start) ||
    /^=+[ \t]*$/.test(start)
  ) {
    markerPositions.add(leading);
  }
  const ordered = start.match(/^\d{1,9}([.)])(?=[ \t]|$)/);
  if (ordered) markerPositions.add(leading + ordered[0].length - 1);

  let encoded = "";
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (
      (index < leading || index >= trailing) &&
      (character === " " || character === "\t")
    ) {
      encoded += character === " " ? "&#32;" : "&#9;";
    } else if (
      /[\\`*_[\]{}&<~|!]/.test(character) ||
      markerPositions.has(index) ||
      (character === ":" &&
        (index === line.length - 1 || /[A-Za-z:/]/.test(line[index + 1] ?? "")))
    ) {
      encoded += `\\${character}`;
    } else {
      encoded += character;
    }
  }
  return encoded;
}

/** Serialize a complete existing code node, preserving its code semantics and delimiter style. */
export function markdownCode(value: string, original: string): string {
  assertText(value, "Code");
  assertText(original, "Original code source");
  const opening = original.match(
    /^( {0,3})(`{3,}|~{3,})([^\r\n]*)(\r\n|\n|\r)/,
  );
  if (opening) return fencedCode(value, original, opening);

  const delimiter = original.match(/^`+/)?.[0];
  const closing = original.match(/`+$/)?.[0];
  if (
    !delimiter ||
    closing !== delimiter ||
    original.length < delimiter.length * 2 + 1
  ) {
    throw new Error(
      "Original must be a complete inline-code span or closed fenced-code block",
    );
  }
  const body = original.slice(delimiter.length, -delimiter.length);
  if (
    [...body.matchAll(/`+/g)].some(
      (match) => match[0].length === delimiter.length,
    )
  ) {
    throw new Error(
      "Original inline code contains an earlier matching closing delimiter",
    );
  }
  if (!value)
    throw new Error(
      "Inline code cannot be empty; remove the code span instead",
    );
  if (/[\r\n]/.test(value))
    throw new Error(
      "Inline code cannot preserve line breaks; use a fenced-code block",
    );

  const width = Math.max(delimiter.length, longestRun(value, "`") + 1);
  const fence = "`".repeat(width);
  const needsPadding =
    value.startsWith("`") ||
    value.endsWith("`") ||
    (value.startsWith(" ") && value.endsWith(" ") && !/^ +$/.test(value));
  return `${fence}${needsPadding ? ` ${value} ` : value}${fence}`;
}

function longestRun(value: string, character: "`" | "~"): number {
  return [...value.matchAll(new RegExp(`${character}+`, "g"))].reduce(
    (longest, match) => Math.max(longest, match[0].length),
    0,
  );
}

function fencedCode(
  value: string,
  original: string,
  opening: RegExpMatchArray,
): string {
  const [, indent, delimiter, info, eol] = opening;
  const character = delimiter[0] as "`" | "~";
  if (character === "`" && info.includes("`"))
    throw new Error("Original backtick fence has an invalid info string");
  const rest = original.slice(opening[0].length);
  const closing = rest.match(
    /(?:^|\r\n|\n|\r)( {0,3})(`{3,}|~{3,})([ \t]*)(\r\n|\n|\r)?$/,
  );
  if (
    !closing ||
    closing[2][0] !== character ||
    closing[2].length < delimiter.length
  ) {
    throw new Error(
      "Original fenced code must end with a matching closing fence",
    );
  }
  const originalBody = rest.slice(0, closing.index!);
  const closesEarly = new RegExp(
    `^ {0,3}${character}{${delimiter.length},}[ \\t]*$`,
  );
  if (originalBody.split(/\r\n|\n|\r/).some((line) => closesEarly.test(line))) {
    throw new Error(
      "Original fenced code contains content after an earlier closing fence",
    );
  }

  const normalized = value.replace(/\r\n?/g, "\n");
  const width = Math.max(
    delimiter.length,
    longestRun(normalized, character) + 1,
  );
  const closeWidth = Math.max(closing[2].length, width);
  const lines = normalized
    ? (normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized).split(
        "\n",
      )
    : [];
  const body = lines.map((line) => `${indent}${line}${eol}`).join("");
  return `${indent}${character.repeat(width)}${info}${eol}${body}${closing[1]}${character.repeat(closeWidth)}${closing[3]}${closing[4] ?? ""}`;
}
