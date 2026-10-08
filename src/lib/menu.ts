/** Pure helpers for a menu button's popover menu (components/instrument/StyleMenu). */

/** The menu's top right, in document px, under its button's bottom right
 *  (`gap` px below it): a popover in the top layer is placed against the
 *  whole document, so it scrolls with the masthead it hangs from. Never
 *  past the document's right edge. */
export function menuPlacement(button: { bottom: number; right: number }, scrollY: number, docWidth: number, gap = 8) {
  return { top: Math.round(button.bottom + scrollY + gap), right: Math.max(0, Math.round(docWidth - button.right)) };
}

/** The item a key moves focus to, from item `at` of `count` (wrapping; from
 *  nowhere, `at` -1, Down goes to the first and Up to the last), or null for
 *  a key the menu leaves alone. */
export function nextItem(key: string, at: number, count: number): number | null {
  if (count <= 0) return null;
  if (key === "ArrowDown") return at < 0 ? 0 : (at + 1) % count;
  if (key === "ArrowUp") return at < 0 ? count - 1 : (at - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
