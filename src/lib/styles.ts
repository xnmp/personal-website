/**
 * The site's art directions (issue #1). A style is a complete raster kit and
 * its type: the same pages and components, dressed by the tokens under
 * `:root[data-style="<id>"]` (src/app/styles/<id>.css). Each has a day finish
 * (worn by the light rice) and a night finish (the dark rices); the rice still
 * colours the screens in every style.
 *
 * Only styles whose kit has shipped are listed: the style menu offers exactly
 * these, and the head script refuses anything else.
 */

export const STYLES = [
  { id: "paper", name: "Paper Diorama", note: "cut paper in a shadow box" },
  { id: "solarpunk", name: "Solarpunk", note: "brass and frosted glass in a greenhouse" },
  { id: "sumi", name: "Sumi-e Ink", note: "hanging scrolls before an ink-wash landscape" },
  { id: "cyanotype", name: "Cyanotype", note: "sun prints taped up before a photogram" },
  { id: "garden", name: "Natural Garden", note: "limestone tablets in a walled cottage garden" },
  { id: "ligne", name: "Ligne Claire", note: "comic panels over a desert outpost" },
  { id: "atlas", name: "Celestial Atlas", note: "enamel plates in gilt over a star chart" },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const DEFAULT_STYLE: StyleId = "paper";

/** localStorage key the choice persists under (beside the rice's "nb-rice") */
export const STYLE_KEY = "nb-style";

/** fired on window after the style changes */
export const STYLE_EVENT = "nb-stylechange";

export const STYLE_IDS: readonly string[] = STYLES.map((s) => s.id);

export function isStyle(v: unknown): v is StyleId {
  return typeof v === "string" && STYLE_IDS.includes(v);
}

/** A stored value as a style: anything unknown (an old or retired style, a
 *  hand-edited value) falls back to the default. */
export function styleOr(v: unknown): StyleId {
  return isStyle(v) ? v : DEFAULT_STYLE;
}

export function styleName(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? id;
}
