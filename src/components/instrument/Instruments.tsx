"use client";

import { useSyncExternalStore } from "react";
import { Key } from "@/components/rack/Key";
import { openIndex, riceLabel, toggleTheme, THEME_EVENT } from "./CommandIndex";

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}
const readRice = () => document.documentElement.dataset.rice ?? "paper";

/**
 * The masthead's control cluster: index and theme. Mouse affordances for what
 * the keyboard already does (`/`, `t`). The theme key prints the current
 * theme's name where there's a keyboard legend beside it, and "theme" on touch
 * screens (where the legend is hidden and the name alone wouldn't say what the
 * key does) and on narrow ones (where a long name would rewrap the masthead
 * each time the theme changes). Its accessible name carries both, so voice control can say
 * either. Changes are announced from `toggleTheme`.
 */
export function Instruments() {
  const rice = useSyncExternalStore(subscribe, readRice, () => "");
  return (
    <span className="instruments">
      <Key legend="/" onClick={openIndex} ariaLabel="Open the index of projects">
        index
      </Key>
      <Key legend="t" className="theme-key" onClick={toggleTheme} ariaLabel={rice ? `Theme: ${riceLabel(rice)}. Switch theme` : "Switch theme"}>
        <span className="rice-name fine-only" suppressHydrationWarning>
          {rice ? riceLabel(rice) : "rice"}
        </span>
        <span className="rice-word coarse-only">theme</span>
      </Key>
      <span className="sr-only" role="status" data-theme-status />
    </span>
  );
}
