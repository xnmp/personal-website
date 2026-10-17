"use client";

import { useSyncExternalStore } from "react";
import { ChoiceMenu } from "./ChoiceMenu";
import { RICES, THEME_EVENT, riceLabel, setTheme } from "./CommandIndex";

const options = RICES.map((id) => ({ id, name: riceLabel(id) }));
const readRice = () => document.documentElement.dataset.rice ?? "paper";
function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

export function ThemeMenu() {
  const rice = useSyncExternalStore(subscribe, readRice, () => "");
  return (
    <ChoiceMenu options={options} current={rice} label="Colour theme" triggerClass="theme-key"
      triggerLabel={rice ? `Theme: ${riceLabel(rice)}. Choose theme` : "Choose theme"} onChoose={setTheme}>
      <span className="key-legend" aria-hidden="true">t</span>
      <span>
        <span className="rice-name fine-only" suppressHydrationWarning>{rice ? riceLabel(rice) : "rice"}</span>
        <span className="rice-word coarse-only">theme</span>
        <svg className="rice-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5Z" fill="currentColor" />
        </svg>
      </span>
    </ChoiceMenu>
  );
}
