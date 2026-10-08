/**
 * A tiny inline markup for hand-edited copy (the about page's content file):
 * `code`, **bold**, *italic* and [text](href). No nesting, no blocks; a
 * marker without its partner stays literal text. Pure, so it is unit-tested
 * and renders the same on the server and the client.
 */

export type Span =
  | { kind: "text"; text: string }
  | { kind: "code" | "strong" | "em"; text: string }
  | { kind: "link"; text: string; href: string };

// one alternation, scanned left to right: the first marker to open wins
const MARK = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Only links a visitor can follow safely: the web, mail, and this site. */
export function safeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href);
}

export function parseInline(src: string): Span[] {
  const out: Span[] = [];
  const text = (t: string) => {
    if (!t) return;
    const last = out[out.length - 1];
    if (last?.kind === "text") out[out.length - 1] = { kind: "text", text: last.text + t };
    else out.push({ kind: "text", text: t });
  };
  let at = 0;
  for (const m of src.matchAll(MARK)) {
    text(src.slice(at, m.index));
    const [whole, code, strong, em, label, href] = m;
    if (code !== undefined) out.push({ kind: "code", text: code });
    else if (strong !== undefined) out.push({ kind: "strong", text: strong });
    else if (em !== undefined) out.push({ kind: "em", text: em });
    // an unsafe target keeps its words and loses the link
    else if (safeHref(href)) out.push({ kind: "link", text: label, href });
    else text(label);
    at = m.index + whole.length;
  }
  text(src.slice(at));
  return out;
}
