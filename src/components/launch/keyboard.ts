import { scrollBehavior } from "@/lib/motion";
import { modalOpen } from "@/lib/page-keys";

/**
 * The launch page's interaction model as one small external store:
 *  - which physical keys are held (keycaps press themselves with the real key)
 *  - whether the live demo is powered on
 * Ctrl+P on this page powers the demo instead of opening the print dialog:
 * the page answers the app's own reflex. Listeners attach only while
 * something is subscribed.
 *
 * An explicit power-on (the key, or Ctrl+P) hands the keyboard to the app once
 * it has loaded, so the next Ctrl+P opens the app's own quick open. A demo that
 * booted because it scrolled into view leaves focus with the page. Whether the
 * app currently has the keyboard is part of the store, so the page can show it.
 */
type Listener = () => void;

let held: ReadonlySet<string> = new Set();
/** off: standby poster. booting: the iframe is loading behind the poster. live: loaded. */
export type DemoState = "off" | "booting" | "live";

let demo: DemoState = "off";
let appHasKeys = false;
let frame: HTMLIFrameElement | null = null; // the demo, once loaded
let focusOnLoad = false;
const listeners = new Set<Listener>();

export const DEMO_ANCHOR = "live";

/** Boot the demo in place (it scrolled into view). */
export function bootDemo() {
  if (demo === "off") {
    demo = "booting";
    emit();
  }
}

/** Boot the demo, bring it into view and give it the keyboard (the power key, or Ctrl+P anywhere). */
export function powerOnDemo() {
  // the power key is about to unmount: park focus on the screen until the app takes it
  const screen = document.querySelector<HTMLElement>(`#${DEMO_ANCHOR} .live-demo`);
  if (screen?.contains(document.activeElement)) screen.focus({ preventScroll: true });
  bootDemo();
  document.getElementById(DEMO_ANCHOR)?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  if (frame?.isConnected) frame.focus({ preventScroll: true });
  else focusOnLoad = true;
}

/** The demo's iframe finished loading. */
export function demoLoaded(el: HTMLIFrameElement) {
  frame = el;
  demo = "live";
  emit();
  if (focusOnLoad) {
    focusOnLoad = false;
    el.focus({ preventScroll: true });
  }
}

/** Pure: is this keydown the quick-open chord (Ctrl+P, or Cmd+P on a Mac)? */
export function isQuickOpen(e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">) {
  return (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "p";
}

/** Pure: normalise a KeyboardEvent.key to the legend printed on our caps. */
export function legendFor(key: string): string {
  if (key === "Control") return "Ctrl";
  if (key === " ") return "Space";
  return key.length === 1 ? key.toUpperCase() : key;
}

const emit = () => listeners.forEach((l) => l());
const set = (next: ReadonlySet<string>) => {
  held = next;
  emit();
};
const onDown = (e: KeyboardEvent) => {
  // under a modal (the index, the screenshot viewer) Ctrl+P is not the page's
  if (isQuickOpen(e) && !modalOpen()) {
    e.preventDefault();
    powerOnDemo();
  }
  const k = legendFor(e.key);
  if (!held.has(k)) set(new Set(held).add(k));
};
const onUp = (e: KeyboardEvent) => {
  const k = legendFor(e.key);
  if (held.has(k)) {
    const next = new Set(held);
    next.delete(k);
    set(next);
  }
};
const setAppHasKeys = (v: boolean) => {
  if (appHasKeys !== v) {
    appHasKeys = v;
    emit();
  }
};
// Focus moving into the iframe blurs this window (and never fires keyup here).
const onBlur = () => {
  if (held.size) set(new Set());
  setAppHasKeys(frame !== null && document.activeElement === frame);
};
const onFocus = () => setAppHasKeys(false);

export function subscribe(l: Listener) {
  if (listeners.size === 0) {
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
  }
  listeners.add(l);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    }
  };
}

export const heldSnapshot = () => held;
const EMPTY: ReadonlySet<string> = new Set();
export const heldServerSnapshot = () => EMPTY;
export const demoSnapshot = () => demo;
export const demoServerSnapshot = (): DemoState => "off";
export const appKeysSnapshot = () => appHasKeys;
export const appKeysServerSnapshot = () => false;
