"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { DEFAULT_STYLE, STYLE_EVENT, STYLE_KEY, STYLES, styleName, type StyleId } from "@/lib/styles";

function subscribe(cb: () => void) {
  window.addEventListener(STYLE_EVENT, cb);
  return () => window.removeEventListener(STYLE_EVENT, cb);
}
const readStyle = () => document.documentElement.dataset.style ?? DEFAULT_STYLE;

/** Dress the page in a style and remember it (the head script reapplies it
 *  before paint on the next load, see app/layout.tsx). */
export function applyStyle(id: StyleId) {
  document.documentElement.dataset.style = id;
  try {
    localStorage.setItem(STYLE_KEY, id);
  } catch {
    /* private mode: the choice lasts this page */
  }
  window.dispatchEvent(new Event(STYLE_EVENT));
}

/**
 * The art-direction picker, on its own sheet at the foot of every page. It
 * is a native radio group (arrows move and choose, Tab leaves, a screen
 * reader hears "Solarpunk, radio button, 2 of 7"), each option printed on a
 * tile; the chosen one is the signal tile. Not part of the `t` cycle: the
 * rice is the screens' colour, the style is everything around them.
 */
export function StylePicker() {
  const current = useSyncExternalStore(subscribe, readStyle, () => "");
  if (STYLES.length < 2) return null;
  return (
    <section className="look faceplate" aria-labelledby="look-legend">
      <fieldset className="look-set">
        <legend id="look-legend" className="silk">
          Art direction
        </legend>
        {/* two even rows of tiles, however many styles there are */}
        <div className="look-opts" style={{ "--look-cols": Math.ceil(STYLES.length / 2) } as CSSProperties}>
          {STYLES.map((s) => (
            <label key={s.id} className="key look-opt" data-tone={current === s.id ? "signal" : undefined}>
              <input
                type="radio"
                name="nb-style"
                value={s.id}
                checked={current === s.id}
                onChange={() => applyStyle(s.id)}
              />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
        <p className="note look-now">
          {current ? `${styleName(current)}: ${STYLES.find((s) => s.id === current)?.note ?? ""}` : " "}
        </p>
      </fieldset>
    </section>
  );
}
