"use client";

import { useSyncExternalStore } from "react";
import { ChoiceMenu } from "./ChoiceMenu";
import { DEFAULT_STYLE, STYLE_EVENT, STYLE_KEY, STYLES, sceneArt, styleName, type StyleId } from "@/lib/styles";

function subscribe(cb: () => void) {
  window.addEventListener(STYLE_EVENT, cb);
  return () => window.removeEventListener(STYLE_EVENT, cb);
}
const readStyle = () => document.documentElement.dataset.style ?? DEFAULT_STYLE;

/** Dress the page in a style and remember it (the head script reapplies it
 *  before paint on the next load, see app/layout.tsx). */
export function applyStyle(id: StyleId) {
  const root = document.documentElement;
  root.dataset.sceneArt = sceneArt(id);
  root.dataset.style = id;
  try {
    localStorage.setItem(STYLE_KEY, id);
  } catch {
    /* private mode: the choice lasts this page */
  }
  window.dispatchEvent(new Event(STYLE_EVENT));
}

/** Art direction and colour share a menu interaction, but independent choices. */
export function StyleMenu() {
  const current = useSyncExternalStore(subscribe, readStyle, () => "");
  return (
    <ChoiceMenu options={STYLES} current={current} label="Art direction"
      triggerClass="style-key" triggerLabel={current ? `Art direction: ${styleName(current)}` : "Art direction"}
      onChoose={applyStyle}>
        <span className="style-name fine-only" suppressHydrationWarning>
          {current ? styleName(current) : "style"}
        </span>
        <span className="style-word coarse-only">style</span>
        {/* on a phone, a palette: no room on the masthead's row for a word */}
        <svg className="style-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <path
            d="M10 2.5a7.5 7.5 0 1 0 0 15c1.1 0 1.6-.8 1.3-1.7-.3-1-.1-2 1.1-2h2.1c1.7 0 3-1.4 3-3.1C17.5 6.1 14.2 2.5 10 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="6.4" cy="9" r="1.25" fill="currentColor" />
          <circle cx="9" cy="5.9" r="1.25" fill="currentColor" />
          <circle cx="12.8" cy="6.6" r="1.25" fill="currentColor" />
        </svg>
        <span className="style-caret" aria-hidden>
          ▾
        </span>
    </ChoiceMenu>
  );
}
