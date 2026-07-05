"use client";

import { openIndex, toggleTheme } from "./CommandIndex";

/**
 * The quiet control cluster in the running head: index + desk lamp.
 * Mouse affordance for what the keyboard already does (`/`, `t`).
 */
export function Instruments() {
  return (
    <span className="instruments">
      <button
        type="button"
        className="instr-btn"
        onClick={openIndex}
        aria-label="Open the index of entries"
      >
        <span className="k">/</span>index
      </button>
      <button
        type="button"
        className="instr-btn"
        onClick={toggleTheme}
        aria-label="Cycle through my terminal themes"
      >
        <span className="k">t</span>theme
      </button>
    </span>
  );
}
