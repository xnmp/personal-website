/**
 * Shortcuts as the visitor's keyboard prints them. Pure: the OS comes in as an
 * argument, so this runs (and is tested) anywhere.
 *
 * The app writes every binding with Ctrl, and its matcher fires a Ctrl binding
 * on either Control or Command (keybinding-parser.ts, matchesShortcut), so on a
 * Mac the honest legend is ⌘. Alt is the Option key.
 */
import type { OS } from "./platform";

/** One printed cap: its legend, its spoken name, and the held-key id it
 * depresses on (KeyboardEvent.key through legendFor in keyboard.ts). */
export type ChordCap = { legend: string; name: string; key: string };

/** Keys macOS keeps for itself under ⌘ (cycle windows, hide, minimise, quit,
 * app switcher, Spotlight). The app's Ctrl binding also fires on the real
 * Control key, so these stay ⌃ on a Mac. */
const MAC_KEEPS = new Set(["`", "H", "M", "Q", "Tab", "Space"]);

const MAC_CAPS: Record<string, ChordCap> = {
  Cmd: { legend: "⌘", name: "Command", key: "Meta" },
  Ctrl: { legend: "⌃", name: "Control", key: "Ctrl" },
  Alt: { legend: "⌥", name: "Option", key: "Alt" },
  Shift: { legend: "⇧", name: "Shift", key: "Shift" },
};

/** Apple's modifier order: Control, Option, Shift, Command. */
const MAC_ORDER = ["Ctrl", "Alt", "Shift", "Cmd"];

const plain = (k: string): ChordCap => ({ legend: k, name: k, key: k });

/** A chord written the app's way (["Ctrl", "Shift", "F"]), as caps for this OS. */
export function chordFor(chord: readonly string[], os: OS | null): ChordCap[] {
  if (os !== "mac" || chord.length === 0) return chord.map(plain);
  const key = chord[chord.length - 1];
  const mods = chord.slice(0, -1).map((m) => (m === "Ctrl" && !MAC_KEEPS.has(key) ? "Cmd" : m));
  return [...MAC_ORDER.filter((m) => mods.includes(m)).map((m) => MAC_CAPS[m]), plain(key)];
}

/** "Ctrl+Shift+F5" as this OS prints it: unchanged off a Mac, "⇧⌘F5" on one. */
export function shortcutFor(shortcut: string, os: OS | null): string {
  if (os !== "mac") return shortcut;
  return chordFor(shortcut.split("+"), os)
    .map((c) => c.legend)
    .join("");
}

const SHORTCUT = /\b(?:(?:Ctrl|Alt|Shift)\+)+(?:F\d{1,2}\b|Tab\b|Space\b|[A-Za-z0-9](?![A-Za-z0-9])|`)/g;

/** Every shortcut in a sentence, rewritten for this OS. */
export const withShortcutsFor = (text: string, os: OS | null): string =>
  os === "mac" ? text.replace(SHORTCUT, (s) => shortcutFor(s, os)) : text;
