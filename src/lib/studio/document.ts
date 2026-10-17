import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import { contentBlock, parseContent } from "../content";
import { projectEntry } from "../project-content";

export type Slot = {
  id: string;
  label: string;
  value: string;
  kind: "markdown" | "text" | "number" | "boolean";
  start: number;
  end: number;
};
export type StudioDocument = {
  id: string;
  title: string;
  route: string;
  source: string;
  revision: string;
  slots: Slot[];
};
export const MAX_SOURCE_BYTES = 1_000_000;

/** Stable source identities, never matching rendered copy back to Markdown. */
export function documentSlots(source: string): Slot[] {
  const document = parseContent(source);
  const slots: Slot[] = [];
  const front = source.match(
    /^\uFEFF?---(?:yaml|yml)?[^\S\r\n]*\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*(?:\r?\n|$)/,
  );
  if (front) {
    const offset = front[0].indexOf(front[1]);
    const yaml = parseDocument(front[1], { version: "1.1" });
    if (yaml.errors.length) throw new Error(yaml.errors[0].message);
    const walk = (node: unknown, path: (string | number)[]) => {
      if (isMap(node))
        node.items.forEach((pair) =>
          walk(pair.value, [
            ...path,
            String(isScalar(pair.key) ? pair.key.value : ""),
          ]),
        );
      else if (isSeq(node))
        node.items.forEach((item, index) => walk(item, [...path, index]));
      else if (
        isScalar(node) &&
        node.range &&
        ["string", "number", "boolean"].includes(typeof node.value)
      ) {
        const kind = typeof node.value as "string" | "number" | "boolean";
        slots.push({
          id: `field:${JSON.stringify(path)}`,
          label: path.join(" · "),
          value: String(node.value),
          kind: kind === "string" ? "text" : kind,
          start: offset + node.range[0],
          end: offset + node.range[1],
        });
      }
    };
    walk(yaml.contents, []);
  }
  const bodyOffset = front?.[0].length ?? 0;
  const markers = [
    ...source
      .slice(bodyOffset)
      .matchAll(/^<!-- block: ([a-z0-9-]+) -->[ \t]*$/gm),
  ];
  markers.forEach((marker, index) => {
    const begin = bodyOffset + marker.index! + marker[0].length;
    const end = markers[index + 1]
      ? bodyOffset + markers[index + 1].index!
      : source.length;
    const raw = source.slice(begin, end);
    const trimmed = raw.trim();
    const start = trimmed
      ? begin + raw.length - raw.trimStart().length
      : begin + (raw.match(/^\r?\n/)?.[0].length ?? 0);
    slots.push({
      id: `block:${marker[1]}`,
      label: marker[1].replace(/-/g, " "),
      value: document.blocks[marker[1]],
      kind: "markdown",
      start,
      end: start + trimmed.length,
    });
  });
  return slots;
}

export function editDocument(
  source: string,
  edits: Readonly<Record<string, string>>,
): string {
  const slots = documentSlots(source);
  const known = new Map(slots.map((slot) => [slot.id, slot]));
  const patches = Object.entries(edits)
    .map(([id, value]) => {
      const slot = known.get(id);
      if (!slot || typeof value !== "string")
        throw new Error(`Unknown or malformed field: ${id}`);
      if (value.includes("\0"))
        throw new Error("Content cannot contain NUL characters");
      if (slot.kind === "markdown" && /^<!-- block:/m.test(value))
        throw new Error("Block markers cannot be inserted inside a block");
      let replacement = value;
      if (slot.kind === "text") replacement = JSON.stringify(value);
      if (slot.kind === "number") {
        const number = Number(value);
        if (!value.trim() || !Number.isFinite(number))
          throw new Error(`${slot.label} must be a finite number`);
        replacement = String(number);
      }
      if (slot.kind === "boolean" && !["true", "false"].includes(value))
        throw new Error(`${slot.label} must be true or false`);
      if (
        slot.kind !== "markdown" &&
        source.slice(slot.start, slot.end).endsWith("\n")
      )
        replacement += "\n";
      return { ...slot, replacement };
    })
    .sort((a, b) => b.start - a.start);
  return patches.reduce(
    (text, patch) =>
      text.slice(0, patch.start) + patch.replacement + text.slice(patch.end),
    source,
  );
}

/** Shared public validators plus preservation of the document's existing contract. */
export function validateDocument(
  id: string,
  source: string,
  original?: string,
): void {
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES)
    throw new Error("Document exceeds 1 MB");
  const document = parseContent(source, id);
  documentSlots(source);
  Object.keys(document.blocks).forEach((name) => contentBlock(document, name));
  if (id.startsWith("projects/")) {
    const entry = projectEntry(document);
    if (`projects/${entry.slug}` !== id)
      throw new Error("A project's slug must match its filename");
  }
  if (original) {
    const previous = parseContent(original, id);
    if (
      JSON.stringify(Object.keys(previous.blocks)) !==
      JSON.stringify(Object.keys(document.blocks))
    )
      throw new Error("Existing block identities must be preserved");
    const previousSlots = documentSlots(original);
    const nextSlots = documentSlots(source);
    if (
      previousSlots.length !== nextSlots.length ||
      previousSlots.some(
        (slot, index) =>
          slot.id !== nextSlots[index].id ||
          slot.kind !== nextSlots[index].kind,
      )
    )
      throw new Error("Existing fields and value types must be preserved");
  }
}

export const previewRoute = (id: string) =>
  id === "home"
    ? "/"
    : id === "zheng-shang-you-play"
      ? "/p/zheng-shang-you/play"
      : id.startsWith("projects/")
        ? `/p/${id.slice(9)}`
        : `/${id}`;
