/**
 * Palette — ported from tableau-frog's domain/color.ts (the app's validated
 * dark-surface instance). Colours the whole page so the site feels like the
 * product. The diverging scale is interpolated in linear-RGB so the midtones
 * don't go muddy (d3-interpolate's Lab space isn't a dependency here).
 */

export const PAGE = "#0d0d0d";
export const SURFACE = "#1a1a19";
export const PANEL = "#141413";
export const INK = "#ffffff";
export const INK_SECONDARY = "#c3c2b7";
export const INK_MUTED = "#898781";
export const GRIDLINE = "#2c2c2a";
export const AXIS = "#383835";

/** Fixed-order categorical slots (dark steps); never cycled past 8. */
export const CATEGORICAL = [
  "#3987e5", // blue
  "#199e70", // aqua
  "#c98500", // yellow
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
  "#d55181", // magenta
  "#d95926", // orange
] as const;

export const categoricalColor = (slot: number): string =>
  CATEGORICAL[((slot % CATEGORICAL.length) + CATEGORICAL.length) % CATEGORICAL.length];

/** Diverging endpoints: blue (under) ↔ neutral gray (baseline) ↔ red (over). */
export const CONTRAST_OUT = "#3987e5"; // under-represented
export const NEUTRAL = "#383835";
export const CONTRAST_IN = "#e66767"; // over-represented

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const srgbToLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const linearToSrgb = (l: number) => {
  const s = l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, s)) * 255);
};

const lerpLinear = (a: string, b: string, t: number): string => {
  const ar = hexToRgb(a).map(srgbToLinear);
  const br = hexToRgb(b).map(srgbToLinear);
  const out = ar.map((v, i) => linearToSrgb(v + (br[i] - v) * t));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
};

/** t in [-1, 1] → diverging colour. Negative = blue/under, positive = red/over. */
export const divergingColor = (t: number): string => {
  const c = Math.max(-1, Math.min(1, t));
  return c < 0 ? lerpLinear(NEUTRAL, CONTRAST_OUT, -c) : lerpLinear(NEUTRAL, CONTRAST_IN, c);
};

/** Sequential magnitude ramp (recedes → bright) for count-only heat. */
export const sequentialColor = (t: number): string => {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5
    ? lerpLinear("#0d366b", "#2a78d6", c * 2)
    : lerpLinear("#2a78d6", "#cde2fb", (c - 0.5) * 2);
};
