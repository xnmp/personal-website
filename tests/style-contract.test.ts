import { test, expect, describe } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { projects } from "../src/data/projects";

// The styles' contract with the content (docs/architecture.md, "Content is
// data"): a style dresses an item by what it is (its place in a cycle, its
// shelf, its glyph, its art's bounds), never by which project it is, so a
// project can be added, removed or featured without any stylesheet changing.
// The home row's and shelves' layout for any count is tested in the browser
// (e2e/content.e2e.ts); this checks the selectors.

const SHEETS = [
  "src/app/kit.css",
  "src/app/globals.css",
  ...readdirSync("src/app/styles")
    .filter((f) => f.endsWith(".css"))
    .map((f) => `src/app/styles/${f}`),
];

/** Every selector in a stylesheet: comments, strings and declarations
 *  skipped, at-rule preludes left out, selector lists split. */
export function selectors(css: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === "\\" ? 2 : 1;
      buf += css.slice(i, j + 1);
      i = j;
    } else if (c === "{") {
      const prelude = buf.trim();
      if (prelude && !prelude.startsWith("@")) out.push(...splitList(prelude));
      buf = "";
    } else if (c === "}" || c === ";") {
      buf = "";
    } else {
      buf += c;
    }
  }
  return out;
}

/** "a, b:is(c, d)" -> ["a", "b:is(c, d)"] */
function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of list) {
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** The compound selectors of a complex one, split at its combinators
 *  (outside parentheses and brackets). */
function compounds(sel: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of sel) {
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (depth === 0 && /[\s>+~]/.test(c)) {
      if (cur) parts.push(cur);
      cur = "";
    } else cur += c;
  }
  if (cur) parts.push(cur);
  return parts;
}

/** Repeated content: the home row's cards, the shelves' modules, the
 *  flagship's list of facts. */
const REPEATED = /showcase-row|\.shelf\b|\.module\b|launch-proof/;
const FIXED_INDEX = /:nth-(?:last-)?(?:child|of-type)\(\s*\d+\s*\)/;
const COUNT_RELATIVE = /:(?:first|last|only)-child|:nth-(?:last-)?child\(\s*(?:\d*n|odd|even)|:nth-last-child\(/;

/** A selector that picks one project by its name, link or slug. */
export function namesAProject(sel: string): string | null {
  if (/\[[^\]]*\/p\//.test(sel)) return "a project's link";
  for (const p of projects) {
    if (new RegExp(`(^|[^a-z0-9-])${p.slug}([^a-z0-9-]|$)`).test(sel)) return p.slug;
  }
  return null;
}

/** A selector that dresses one item of a repeated list by its fixed place,
 *  so a list of another length leaves an item undressed or dresses the
 *  wrong one. A fixed place in a quantity query (":nth-child(4):last-child":
 *  exactly four) or a cycle (":nth-child(4n+2)") is fine. */
export function fixesAPlace(sel: string): boolean {
  if (!REPEATED.test(sel)) return false;
  return compounds(sel).some((c) => {
    if (!FIXED_INDEX.test(c)) return false;
    const rest = c.replace(FIXED_INDEX, "");
    return !COUNT_RELATIVE.test(rest);
  });
}

describe("the contract's checks", () => {
  test("find a project named by its link or slug, not a class that merely contains one", () => {
    expect(namesAProject('.card[href="/p/scrivo"]')).toBe("a project's link");
    expect(namesAProject(".module#bwai .title")).toBe("bwai");
    expect(namesAProject(".scrivo-like .card")).toBeNull();
    expect(namesAProject('.card[data-shelf="tools"]')).toBeNull();
  });

  test("find a fixed place on repeated items, not a cycle, a role or a quantity query", () => {
    expect(fixesAPlace(".showcase-row > li:nth-child(3) .card")).toBe(true);
    expect(fixesAPlace(".shelf > :nth-of-type(2)")).toBe(true);
    expect(fixesAPlace(".showcase-row > li:nth-child(4n+3) .card")).toBe(false);
    expect(fixesAPlace(".showcase-row > li:first-child .card")).toBe(false);
    expect(fixesAPlace(".showcase-row:has(> li:nth-child(4):last-child)")).toBe(false);
    expect(fixesAPlace(".shelf > :nth-last-child(2):nth-child(3n+1)")).toBe(false);
    expect(fixesAPlace(".xw-lights i:nth-child(2)")).toBe(false);
  });

  test("read selectors past comments, strings and at-rules", () => {
    const css = `/* .a{} */ @media (min-width: 900px) { .b, .c:is(.d, .e) { content: "}{"; } } .f { x: y }`;
    expect(selectors(css)).toEqual([".b", ".c:is(.d, .e)", ".f"]);
  });
});

describe.each(SHEETS)("%s", (sheet) => {
  const all = selectors(readFileSync(sheet, "utf8"));

  test("dresses no project by its name, link or slug", () => {
    const named = all.flatMap((s) => {
      const what = namesAProject(s);
      return what ? [`${s}  (${what})`] : [];
    });
    expect(named).toEqual([]);
  });

  test("dresses no card, module or fact by a fixed place in its list", () => {
    expect(all.filter(fixesAPlace)).toEqual([]);
  });
});
