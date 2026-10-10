"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Key } from "@/components/rack/Key";
import { openIndex, riceLabel, toggleTheme, THEME_EVENT } from "./CommandIndex";
import { StyleMenu } from "./StyleMenu";

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}
const readRice = () => document.documentElement.dataset.rice ?? "paper";

/**
 * The masthead's control cluster: the about page, then index, theme and art
 * direction (its menu, StyleMenu). The about key is a page link, so it has no
 * legend. On phones each key goes to a glyph in turn as the row narrows (the
 * style key first, then theme and about, then index; globals.css).
 * The others are mouse affordances for what
 * the keyboard already does (`/`, `t`). The theme key prints the current
 * theme's name where there's a keyboard legend beside it, and "theme" on touch
 * screens (where the legend is hidden and the name alone wouldn't say what the
 * key does) and on narrow ones (where a long name would rewrap the masthead
 * each time the theme changes). Its accessible name carries both, so voice control can say
 * either. Changes are announced from `toggleTheme`.
 */
export function Instruments() {
  const rice = useSyncExternalStore(subscribe, readRice, () => "");
  const path = usePathname();
  return (
    <span className="instruments">
      <Key href="/about" className="about-key" current={path === "/about"} ariaLabel="About me">
        <span className="about-word">about</span>
        {/* on the narrowest phones, a head and shoulders: the row has no room for the word */}
        <svg className="about-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <circle cx="10" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 17.25a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Key>
      <Key legend="/" className="index-key" onClick={openIndex} ariaLabel="Open the index of projects">
        <span className="index-word">index</span>
        {/* on the narrowest phones, a lens: the row has no room for the word */}
        <svg className="index-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.5 12.5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Key>
      <Key legend="t" className="theme-key" onClick={toggleTheme} ariaLabel={rice ? `Theme: ${riceLabel(rice)}. Switch theme` : "Switch theme"}>
        <span className="rice-name fine-only" suppressHydrationWarning>
          {rice ? riceLabel(rice) : "rice"}
        </span>
        <span className="rice-word coarse-only">theme</span>
        {/* on the narrowest phones, a half-lit disc: the row has no room for the word */}
        <svg className="rice-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5Z" fill="currentColor" />
        </svg>
      </Key>
      <StyleMenu />
      <span className="sr-only" role="status" data-theme-status />
    </span>
  );
}
