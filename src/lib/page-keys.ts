/**
 * Guards for the page's own single-key shortcuts (`/`, `t`, `j`/`k`, Ctrl+P).
 * They act on the page, so they stand down while the visitor is typing or a
 * modal (the index, the screenshot viewer) has the page; the modal's own keys
 * take over.
 */

/** Is this key going into something the visitor types in? */
export function isEditable(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
  );
}

/** A dialog or chooser owns the keyboard while open; `except` may handle its own shortcuts. */
export function overlayOpen(except?: Element | null): boolean {
  return Array.from(document.querySelectorAll("dialog[open], [popover]:popover-open")).some((d) => d !== except);
}
