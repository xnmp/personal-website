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

/** Is a modal dialog open, other than `except`? Every <dialog> here opens
 * with showModal, so an open one is a modal one. */
export function modalOpen(except?: Element | null): boolean {
  return Array.from(document.querySelectorAll("dialog[open]")).some((d) => d !== except);
}
