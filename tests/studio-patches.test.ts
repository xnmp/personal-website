import { describe, expect, test } from "bun:test";
import { applyTextPatches } from "../src/lib/studio/patches";

describe("source-preserving text patches", () => {
  test("applies independent edits without shifting later source ranges", () => {
    expect(applyTextPatches("First.\n\nSecond.", [{ start: 0, end: 5, value: "A longer first" }, { start: 8, end: 14, value: "Next" }])).toBe("A longer first.\n\nNext.");
  });
  test("removes an empty formatted node, including its now-empty parent", () => {
    const source = "Before **hello [world](/about)** after.";
    const strong = { start: 7, end: 32, content: { start: 9, end: 30 } };
    const link = { start: 15, end: 30, content: { start: 16, end: 21 } };
    expect(source.slice(strong.start, strong.end)).toBe("**hello [world](/about)**");
    expect(applyTextPatches(source, [
      { start: 9, end: 15, value: "", containers: [strong] },
      { start: 16, end: 21, value: "", containers: [strong, link] },
    ])).toBe("Before  after.");
  });
  test("keeps formatting and link destination while any content remains", () => {
    expect(applyTextPatches("**hello [world](/about)**", [
      { start: 2, end: 8, value: "", containers: [{ start: 0, end: 25, content: { start: 2, end: 23 } }] },
    ])).toBe("**[world](/about)**");
  });
  test("removes empty authored directives without leaving inaccessible syntax", () => {
    const source = ':span[text]{class=soft}';
    expect(applyTextPatches(source, [{ start: 6, end: 10, value: "", containers: [{ start: 0, end: source.length, content: { start: 6, end: 10 } }] }])).toBe("");
  });
  test("preserves templates and unedited markup even when nearby copy is deleted", () => {
    const source = "**hello {{version}}**";
    expect(applyTextPatches(source, [{ start: 2, end: 8, value: "", containers: [{ start: 0, end: source.length, content: { start: 2, end: source.length - 2 } }] }])).toBe("**{{version}}**");
  });
});
