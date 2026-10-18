import { describe, expect, test } from "bun:test";
import { listEnterEdit } from "../src/lib/studio/list-continuation";

function enter(source: string, caret = source.length, end = caret) {
  const edit = listEnterEdit(source, caret, end);
  return edit ? source.slice(0, edit.start) + edit.text + source.slice(edit.end) : null;
}

describe("unordered list Enter", () => {
  test("continues either marker and preserves indentation and spacing", () => {
    expect(enter("- First")).toBe("- First\n- ");
    expect(enter("* First")).toBe("* First\n* ");
    expect(enter("Notes\n  *  Nested")).toBe("Notes\n  *  Nested\n  *  ");
    expect(enter("\t- Item")).toBe("\t- Item\n\t- ");
  });
  test("Enter on the empty continued item removes its marker", () => {
    for (const marker of ["-", "*"]) {
      const continued = enter(`${marker} Item`)!;
      expect(enter(continued)).toBe(`${marker} Item\n\n`);
      expect(enter(`${marker} `)).toBe("\n");
      expect(enter(marker)).toBe("\n");
    }
    expect(enter("- Item\n  * \t ")).toBe("- Item\n\n");
    expect(enter("- Item\n- \nLater", 9)).toBe("- Item\n\n\nLater");
  });
  test("splits an item at the caret without changing neighbouring text", () => {
    expect(enter("Before\n- First second\nAfter", 14)).toBe("Before\n- First\n-  second\nAfter");
    expect(enter("- 🌱 notes", 4)).toBe("- 🌱\n-  notes");
  });
  test("leaves ordinary text, formatting, selected text and the marker itself native", () => {
    for (const source of ["", "Plain text", "---", "**bold**", "*italic*", "-flag", "- Item\n"]) expect(enter(source)).toBeNull();
    expect(enter("- Item", 0)).toBeNull();
    expect(enter("- Item", 1)).toBeNull();
    expect(enter("- Item", 2, 6)).toBeNull();
    expect(enter("- One\n- Two", 3, 10)).toBeNull();
    expect(enter("\n- Item", 0)).toBeNull();
  });
  test("rejects invalid positions and handles long items", () => {
    for (const caret of [-1, 99, 0.5, NaN, Infinity]) expect(enter("- Item", caret)).toBeNull();
    const source = `- ${"x".repeat(100_000)}`;
    expect(enter(source)).toBe(`${source}\n- `);
  });
});
