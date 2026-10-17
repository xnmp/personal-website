/** Pure helpers for a menu button's popover menu (components/instrument/StyleMenu). */

/** Viewport placement for a measured popover. Prefer below the trigger;
 *  use the larger side when it needs to scroll, and keep both edges in view. */
export function menuPlacement(
  button: { top: number; bottom: number; right: number },
  menu: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 8,
) {
  const inset = 14;
  const below = Math.max(0, viewport.height - button.bottom - gap - inset);
  const above = Math.max(0, button.top - gap - inset);
  const down = below >= menu.height || below >= above;
  const maxHeight = Math.min(menu.height, down ? below : above);
  const top = down ? button.bottom + gap : button.top - gap - maxHeight;
  const left = Math.max(inset, Math.min(button.right - menu.width, viewport.width - menu.width - inset));
  return { top: Math.round(top), left: Math.round(left), maxHeight: Math.floor(maxHeight) };
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
