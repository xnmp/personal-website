"use client";

import { useEffect } from "react";
import { scrollBehavior } from "@/lib/motion";
import { isEditable, modalOpen } from "@/lib/page-keys";

const TARGETS = "[data-rack-stop]";

/** Pure: which stop `j`/`k` moves to from `current` (-1 = none focused). */
export function nextStop(current: number, count: number, key: "j" | "k"): number {
  if (count === 0) return -1;
  if (current < 0) return 0;
  return key === "j" ? Math.min(current + 1, count - 1) : Math.max(current - 1, 0);
}

/**
 * `j`/`k` move focus between modules in the rack, like windows in the tiling
 * WM the site grew out of. Focus is real browser focus, so Enter opens.
 * Renders nothing; the effect is a genuine global key subscription.
 */
export function RackKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target) || modalOpen()) return;
      if (e.key !== "j" && e.key !== "k") return;
      const stops = Array.from(document.querySelectorAll<HTMLElement>(TARGETS));
      const i = nextStop(stops.indexOf(document.activeElement as HTMLElement), stops.length, e.key);
      if (i < 0) return;
      e.preventDefault();
      stops[i].focus();
      stops[i].scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
