import { describe, expect, test } from "bun:test";
import { chordFor, shortcutFor, withShortcutsFor } from "../src/components/launch/shortcuts";

const legends = (chord: string[], os: Parameters<typeof chordFor>[1]) => chordFor(chord, os).map((c) => c.legend);

describe("chordFor", () => {
  test("prints the app's own spelling off a Mac and before the OS is known", () => {
    expect(legends(["Ctrl", "Shift", "F"], "linux")).toEqual(["Ctrl", "Shift", "F"]);
    expect(legends(["Ctrl", "Alt", "G"], "windows")).toEqual(["Ctrl", "Alt", "G"]);
    expect(legends(["Ctrl", "P"], null)).toEqual(["Ctrl", "P"]);
  });

  test("on a Mac, Ctrl is Command and Alt is Option, in Apple's modifier order", () => {
    expect(legends(["Ctrl", "P"], "mac")).toEqual(["⌘", "P"]);
    expect(legends(["Ctrl", "Shift", "F"], "mac")).toEqual(["⇧", "⌘", "F"]);
    expect(legends(["Ctrl", "Alt", "G"], "mac")).toEqual(["⌥", "⌘", "G"]);
  });

  test("keeps Control where macOS owns the Command chord", () => {
    expect(legends(["Ctrl", "`"], "mac")).toEqual(["⌃", "`"]);
    expect(legends(["Ctrl", "Q"], "mac")).toEqual(["⌃", "Q"]);
  });

  test("each cap depresses on the key the page reports as held", () => {
    expect(chordFor(["Ctrl", "Alt", "G"], "mac").map((c) => c.key)).toEqual(["Alt", "Meta", "G"]);
    expect(chordFor(["Ctrl", "`"], "mac").map((c) => c.key)).toEqual(["Ctrl", "`"]);
  });

  test("names caps in words for screen readers", () => {
    expect(chordFor(["Ctrl", "Alt", "G"], "mac").map((c) => c.name)).toEqual(["Option", "Command", "G"]);
  });

  test("a bare key or an empty chord passes through", () => {
    expect(legends(["F6"], "mac")).toEqual(["F6"]);
    expect(legends([], "mac")).toEqual([]);
  });
});

describe("shortcutFor", () => {
  test("joins Mac legends the way Mac menus print them", () => {
    expect(shortcutFor("Ctrl+Shift+F5", "mac")).toBe("⇧⌘F5");
    expect(shortcutFor("Alt+I", "mac")).toBe("⌥I");
    expect(shortcutFor("Ctrl+Shift+F5", "linux")).toBe("Ctrl+Shift+F5");
  });
});

describe("withShortcutsFor", () => {
  test("rewrites every shortcut in a sentence on a Mac", () => {
    expect(withShortcutsFor("Dual pane. F6 jumps sides, Ctrl+Shift+F5 copies across.", "mac")).toBe(
      "Dual pane. F6 jumps sides, ⇧⌘F5 copies across."
    );
    expect(withShortcutsFor("New tab. Ctrl+Shift+T brings back the last one you closed.", "mac")).toBe(
      "New tab. ⇧⌘T brings back the last one you closed."
    );
    expect(withShortcutsFor("Ctrl+P for your filesystem.", "mac")).toBe("⌘P for your filesystem.");
  });

  test("leaves words that only look like modifiers alone", () => {
    expect(withShortcutsFor("Alternate panes, Shifting focus, Ctrl+", "mac")).toBe("Alternate panes, Shifting focus, Ctrl+");
    expect(withShortcutsFor("Ctrl+Print", "mac")).toBe("Ctrl+Print");
  });

  test("changes nothing off a Mac, and copes with empty and very long text", () => {
    expect(withShortcutsFor("Ctrl+P", "windows")).toBe("Ctrl+P");
    expect(withShortcutsFor("", "mac")).toBe("");
    const long = "Ctrl+P ".repeat(20000);
    expect(withShortcutsFor(long, "mac")).toBe("⌘P ".repeat(20000));
  });
});
