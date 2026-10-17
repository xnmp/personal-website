import type { CSSProperties } from "react";

/** Existing typography treatments. Content can name a treatment, never inject CSS. */
export const MARKDOWN_VARIANTS: Readonly<Record<string, CSSProperties>> = {
  "ink": {
    "color": "var(--ink)"
  },
  "keyboard-hint": {
    "color": "var(--ink-3)",
    "fontSize": 12,
    "display": "flex",
    "gap": 6,
    "alignItems": "center"
  },
  "yellow": {
    "color": "var(--yellow)"
  },
  "blue": {
    "color": "var(--blue)"
  },
  "aqua": {
    "color": "var(--aqua)"
  }
};
