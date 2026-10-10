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

/**
 * How a style's scene is drawn. A "diorama" is layered cut-outs, which the 3D
 * scene (components/rack/scene3d) can stand in depth. A "plate" is one
 * painting: the mock's own picture with the page painted out (and painted on
 * past its edges), which kit.css registers to the home page's stage so that
 * what the page stands against stays where the mock has it; the 3D scene
 * stands down for it (one plane has no depth to give, and the 3D framing
 * covers the frame, which would break the registration).
 */
export type SceneArt = "diorama" | "plate";

export const STYLES = [
  { id: "paper", name: "Paper Diorama", note: "cut paper in a shadow box", scene: "diorama" },
  { id: "solarpunk", name: "Solarpunk", note: "brass and frosted glass in a greenhouse", scene: "plate" },
  { id: "sumi", name: "Sumi-e Ink", note: "hanging scrolls before an ink-wash landscape", scene: "plate" },
  { id: "cyanotype", name: "Cyanotype", note: "sun prints taped up before a photogram", scene: "plate" },
  { id: "garden", name: "Natural Garden", note: "limestone tablets in a walled cottage garden", scene: "plate" },
  { id: "ligne", name: "Ligne Claire", note: "comic panels over a desert outpost", scene: "plate" },
  { id: "atlas", name: "Celestial Atlas", note: "enamel plates in gilt over a star chart", scene: "plate" },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const DEFAULT_STYLE: StyleId = "paper";

/** localStorage key the choice persists under (beside the rice's "nb-rice") */
export const STYLE_KEY = "nb-style";

/** fired on window after the style changes */
export const STYLE_EVENT = "nb-stylechange";

export const STYLE_IDS: readonly string[] = STYLES.map((s) => s.id);

/** each style's scene art, for the head script (it sets data-scene-art) */
export const SCENE_ART: Readonly<Record<string, SceneArt>> = Object.fromEntries(STYLES.map((s) => [s.id, s.scene]));

export function sceneArt(id: string): SceneArt {
  return STYLES.find((s) => s.id === id)?.scene ?? "diorama";
}

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
