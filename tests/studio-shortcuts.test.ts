import { describe, expect, test } from "bun:test";
import { withShortcutsFor } from "../src/components/launch/shortcuts";
import { editShortcutText } from "../src/lib/studio/shortcuts";

const editMac = (source: string, next: string): string => {
  const result = editShortcutText(
    source,
    withShortcutsFor(source, "mac"),
    next,
  );
  expect(withShortcutsFor(result, "mac")).toBe(next);
  return result;
};

describe("editing platform shortcut prose", () => {
  test("keeps canonical bindings when editing prose before or after them", () => {
    const source = "Press Ctrl+Shift+P to open.";
    expect(editMac(source, "Use ⇧⌘P to open.")).toBe(
      "Use Ctrl+Shift+P to open.",
    );
    expect(editMac(source, "Press ⇧⌘P to search.")).toBe(
      "Press Ctrl+Shift+P to search.",
    );
    expect(editMac(source, "Press ⇧⌘P now to open.")).toBe(
      "Press Ctrl+Shift+P now to open.",
    );
  });

  test("retains the exact source spelling of repeated equivalent chords", () => {
    const source = "Ctrl+Shift+P then Shift+Ctrl+P then Ctrl+P.";
    expect(editMac(source, "⇧⌘P or ⇧⌘P then ⌘P.")).toBe(
      "Ctrl+Shift+P or Shift+Ctrl+P then Ctrl+P.",
    );
    expect(editMac(source, "⇧⌘P then ⇧⌘P then ⌘P!")).toBe(
      "Ctrl+Shift+P then Shift+Ctrl+P then Ctrl+P!",
    );
    expect(editMac("Ctrl+P Ctrl+P", "⌘P")).toBe("Ctrl+P");
  });

  test("uses the shared macOS reserved Control and modifier-order behavior", () => {
    const source = "Ctrl+Q, Ctrl+Tab, Ctrl+Space, Ctrl+`, Ctrl+Alt+G.";
    expect(editMac(source, "Keys: ⌃Q, ⌃Tab, ⌃Space, ⌃`, ⌥⌘G.")).toBe(
      `Keys: ${source}`,
    );
    expect(
      editMac("Ctrl+H hides; Ctrl+P opens.", "⌃H hides; ⌘P searches."),
    ).toBe("Ctrl+H hides; Ctrl+P searches.");
  });

  test("treats a changed shortcut as one visible atom, preserving its unedited part", () => {
    expect(editMac("Press Ctrl+Shift+P now.", "Press ⇧⌘O now.")).toBe(
      "Press ⇧⌘O now.",
    );
    expect(editMac("Press Ctrl+Shift+P now.", "Press ⇧O⌘P now.")).toBe(
      "Press ⇧O⌘P now.",
    );
    expect(editMac("Press Ctrl+Shift+P now.", "Press ⌘P now.")).toBe(
      "Press ⌘P now.",
    );
    expect(editMac("Use Ctrl+Tab or Ctrl+P.", "Use ⌃TaX or ⌘P.")).toBe(
      "Use ⌃TaX or Ctrl+P.",
    );
  });

  test("deletes complete shortcuts or selections spanning multiple atoms", () => {
    expect(editMac("Use Ctrl+P then Ctrl+Q.", "Use  then ⌃Q.")).toBe(
      "Use  then Ctrl+Q.",
    );
    expect(editMac("Use Ctrl+P then Ctrl+Q.", "Use ⌘XQ.")).toBe("Use ⌘XQ.");
    expect(editMac("Ctrl+P", "")).toBe("");
  });

  test("inserts at shortcut boundaries without rewriting those shortcuts", () => {
    expect(editMac("Ctrl+P", "before ⌘P")).toBe("before Ctrl+P");
    expect(editMac("Ctrl+P", "⌘P after")).toBe("Ctrl+P after");
    expect(editMac("Ctrl+P/Ctrl+Q", "⌘P + /⌃Q")).toBe("Ctrl+P + /Ctrl+Q");
  });

  test("materializes boundary atoms when an edit changes canonical token recognition", () => {
    expect(editMac("Use Ctrl+P or Ctrl+Q.", "Use⌘P or ⌃Q.")).toBe(
      "Use⌘P or Ctrl+Q.",
    );
    expect(editMac("Ctrl+P, Ctrl+Q.", "A⌘P, ⌃Q.")).toBe("A⌘P, Ctrl+Q.");
    expect(editMac("Ctrl+P, Ctrl+Q.", "⌘Px, ⌃Q.")).toBe("⌘Px, Ctrl+Q.");
    expect(editMac("Ctrl+F12 Ctrl+Q", "⌘F12x ⌃Q")).toBe("⌘F12x Ctrl+Q");
  });

  test("maps UTF-16 offsets through Unicode prose and combining marks", () => {
    const source = "🌱 中文 Ctrl+P e\u0301 Ctrl+Q 🧑‍💻";
    expect(editMac(source, "🌿 中文 ⌘P e\u0301 ⌃Q 🧑‍💻")).toBe(
      "🌿 中文 Ctrl+P e\u0301 Ctrl+Q 🧑‍💻",
    );
    expect(editMac(source, "🌱 中文 ⌘P é ⌃Q 🧑‍💻")).toBe(
      "🌱 中文 Ctrl+P é Ctrl+Q 🧑‍💻",
    );
    expect(editMac(source, "🌱 中文 ⌘P e\u0301 ⌃Q 🧑‍🔬")).toBe(
      "🌱 中文 Ctrl+P e\u0301 Ctrl+Q 🧑‍🔬",
    );
  });

  test("supports successive events after an actual shortcut has changed", () => {
    const first = editMac("Ctrl+P then Ctrl+Q.", "⌘O then ⌃Q.");
    expect(first).toBe("⌘O then Ctrl+Q.");
    expect(editMac(first, "⌘O and ⌃Q.")).toBe("⌘O and Ctrl+Q.");
  });

  test("passes non-Mac, untransformed and initial display edits through", () => {
    for (const source of ["", "Plain text", "Ctrl+P", "Ctrl+Print", "⌘P"]) {
      expect(editShortcutText(source, source, `${source}!`)).toBe(`${source}!`);
    }
    expect(editMac("Ctrl+P and Ctrl+Q", "⌘P and ⌃Q")).toBe("Ctrl+P and Ctrl+Q");
  });

  test("handles long prose without changing unrelated shortcut atoms", () => {
    const source = "Ctrl+Shift+P ".repeat(20000);
    expect(editMac(source, `${withShortcutsFor(source, "mac")}done`)).toBe(
      `${source}done`,
    );
  });

  test("rejects mismatched prior displays and malformed inputs", () => {
    expect(() => editShortcutText("Ctrl+P", "⌘Q", "⌘O")).toThrow(
      "Previous shortcut display does not match its source",
    );
    for (const invalid of [null, undefined, 1, {}, []]) {
      expect(() => editShortcutText(invalid as never, "", "")).toThrow(
        TypeError,
      );
      expect(() => editShortcutText("", invalid as never, "")).toThrow(
        TypeError,
      );
      expect(() => editShortcutText("", "", invalid as never)).toThrow(
        TypeError,
      );
    }
  });
});
