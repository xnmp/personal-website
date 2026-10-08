/**
 * The geometry of the 3D diorama, kept free of three.js so it can be tested.
 *
 * The CSS scene draws each layer full-frame, fitted with `cover` and anchored
 * to the bottom (kit.css). The 3D scene must look exactly like it at rest, so
 * a reader who never sees the WebGL version gets the same picture. Each
 * layer becomes a plane at its own depth in front of a perspective camera,
 * sized and placed so that it projects onto the screen at precisely the rect
 * the CSS layer occupies. Once the camera moves, the depths make the layers
 * slide over one another (parallax), and the light, which shines on real
 * gaps between them, makes each cast a real shadow on the ones behind.
 *
 * Coordinates: the camera rests at the origin looking down -z, with +y up. A
 * layer at depth d sits on the plane z = -d. Screen px have y downward.
 */

export type Size = { w: number; h: number };

/** Plane extension past the art, as fractions of the art's own size. The
 *  extension is filled by mirroring the art at its edge (the texture repeats
 *  mirrored), so a camera move never shows a plane's edge. */
export type Overscan = { top: number; bottom: number; side: number };

export type PlaneLayout = {
  /** plane size in world units */
  width: number;
  height: number;
  /** world position of the plane's bottom-centre: its hinge for the pop-up */
  hinge: { x: number; y: number; z: number };
  /** texture transform that maps the plane's UVs onto the overscanned art */
  repeat: [number, number];
  offset: [number, number];
};

const rad = (deg: number) => (deg * Math.PI) / 180;

/** World units per screen px for a plane at `depth`, seen through a camera of
 *  vertical field of view `fov` (degrees) on a viewport `h` px tall. */
export const worldPerPx = (depth: number, fov: number, h: number) => (2 * depth * Math.tan(rad(fov) / 2)) / h;

/** The scale `background-size: cover` applies to `art` in `view`. */
export const coverScale = (view: Size, art: Size) => Math.max(view.w / art.w, view.h / art.h);

/**
 * Where a layer sits across the frame. By default a layer covers the frame,
 * centred. A cut-out that carries a landmark at one side of the art (a
 * style's left and right layers, kit.css --left-anchor, --right-anchor,
 * --side-span) may instead be anchored to that side, `anchor` 0 putting the
 * art's left edge on the frame's and 1 its right edge on the frame's (as CSS
 * background-position-x in %), and held to `span` frame widths at most, so
 * that on a narrow screen its landmark keeps to its side, smaller, rather
 * than being cropped away. Its art's foot stays on the frame's foot.
 */
export type Placement = { anchor: number; span: number };
export const COVER: Placement = { anchor: 0.5, span: Infinity };

/** The scale a layer placed by `place` is drawn at: `cover`, held to its span. */
export const placedScale = (view: Size, art: Size, place: Placement) => Math.min(coverScale(view, art), (place.span * view.w) / art.w);

/**
 * Place a layer at `depth` so that, from the resting camera, it covers the
 * same screen rect as the CSS layer (by default cover, centred,
 * bottom-anchored; see Placement), with `over` extra mirrored art around it.
 */
export function layoutPlane(view: Size, art: Size, depth: number, fov: number, over: Overscan, place: Placement = COVER): PlaneLayout {
  const k = worldPerPx(depth, fov, view.h);
  const s = placedScale(view, art, place);
  const artW = art.w * s; // the art's on-screen size in px
  const artH = art.h * s;
  const width = artW * (1 + 2 * over.side) * k;
  const height = artH * (1 + over.top + over.bottom) * k;
  // the art's bottom edge sits on the screen's bottom edge; the plane carries
  // on below it by the bottom overscan, and that edge is the hinge
  const hingeScreenY = view.h + over.bottom * artH;
  // across, the art's `anchor` point on the frame's: its centre that far
  // from the frame's centre
  const hingeScreenX = place.anchor * (view.w - artW) + artW / 2;
  return {
    width,
    height,
    hinge: { x: (hingeScreenX - view.w / 2) * k, y: (view.h / 2 - hingeScreenY) * k, z: -depth },
    repeat: [1 + 2 * over.side, 1 + over.top + over.bottom],
    offset: [-over.side, -over.bottom],
  };
}

/** The sun (or moon) sprite: its size, and where its disc sits in it, in
 *  sprite px (scene/<finish>/sun.webp; kit.css --sun-sw/sh/cx/cy/r). */
export type SunSprite = { w: number; h: number; cx: number; cy: number; r: number };

/**
 * Where the sun sprite lies on screen: scaled so its disc is `d` px across,
 * and placed so the disc's centre is at `at` (screen px). kit.css places the
 * CSS sun by the same rule, from the same tokens.
 */
export function sunRect(sprite: SunSprite, at: { x: number; y: number }, d: number) {
  const s = d / (2 * sprite.r); // screen px per sprite px
  return { left: at.x - sprite.cx * s, top: at.y - sprite.cy * s, width: sprite.w * s, height: sprite.h * s };
}

/** Where a point at `depth` on the plane lands on screen, from a camera at
 *  `cam` (no rotation). Used to check the layout and the rig. */
export function project(view: Size, fov: number, cam: { x: number; y: number; z: number }, p: { x: number; y: number; z: number }) {
  const dist = cam.z - p.z; // the camera looks down -z
  const k = worldPerPx(dist, fov, view.h);
  return { x: view.w / 2 + (p.x - cam.x) / k, y: view.h / 2 - (p.y - cam.y) / k };
}

export type Rig = {
  /** the nearest layer's depth: the rig's moves are sized against it */
  nearDepth: number;
  /** how far the nearest layer slides, in px, at full pointer deflection */
  pointerPx: number;
  /** how far the nearest layer sinks at the end of the page, in viewport heights */
  sink: number;
};

/**
 * The camera position for a pointer at (`px`, `py`) in [-1, 1] (right, down
 * positive) and a scroll progress `scroll` in [0, 1]. The camera only
 * translates, never turns, so every layer keeps its registration and only
 * the parallax between depths changes. Scrolling raises the camera, so the
 * near layers sink faster than the far ones, as if you were climbing above
 * the valley.
 */
export function cameraAt(view: Size, fov: number, rig: Rig, px: number, py: number, scroll: number) {
  const k = worldPerPx(rig.nearDepth, fov, view.h);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    x: clamp(px, -1, 1) * rig.pointerPx * k,
    y: (clamp(scroll, 0, 1) * rig.sink * view.h - clamp(py, -1, 1) * rig.pointerPx) * k,
    z: 0,
  };
}

/**
 * The smallest overscan that keeps every plane's edge off screen for this
 * rig, with a margin. Pointer moves can go either way; scrolling only raises
 * the camera, which brings the far layers' tops down into view (the near
 * layers' tops are transparent sky, so only the sky's top matters, and it is
 * the far layer that moves least).
 */
export function overscanFor(view: Size, art: Size, rig: Rig, farDepth: number, margin = 1.25): Overscan {
  const artH = art.h * coverScale(view, art);
  const artW = art.w * coverScale(view, art);
  // a camera move of D world units slides a layer at depth d by D / k(d) px,
  // so the nearest layer slides most: pointerPx at full deflection
  const pointerFracH = rig.pointerPx / artH;
  const pointerFracW = rig.pointerPx / artW;
  const sinkFar = (rig.sink * view.h * (rig.nearDepth / farDepth)) / artH;
  return {
    top: (sinkFar + pointerFracH) * margin,
    bottom: pointerFracH * margin,
    side: pointerFracW * margin,
  };
}

/** easeOutBack: overshoots past 1, then settles, as a pop-up page does. */
export const backOut = (t: number, overshoot = 1.25) => {
  const c3 = overshoot + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + overshoot * u * u;
};

export type Rise = { delay: number; duration: number };

/**
 * A layer's hinge angle (radians) at time `t` ms after the entrance starts.
 * It starts lying flat, folded back from the viewer (-90°), and swings up
 * past upright before settling at 0, as a pop-up layer does when the book
 * opens.
 */
export function hingeAngle(t: number, rise: Rise) {
  const e = Math.min(1, Math.max(0, (t - rise.delay) / rise.duration));
  return (-Math.PI / 2) * (1 - backOut(e));
}

/** Has every layer finished rising by time `t`? */
export const risen = (t: number, rises: readonly Rise[]) => rises.every((r) => t >= r.delay + r.duration);

/**
 * How upright a hinged layer is, from lying flat (0) to standing (1). The
 * overshoot past upright counts as standing.
 */
export const standing = (angle: number) => 1 - Math.min(1, Math.abs(Math.min(0, angle)) / (Math.PI / 2));

/**
 * A layer's cast shadow, from how upright it stands. Lying flat it casts
 * nothing on the layer behind; as it stands the shadow darkens in, and it
 * starts long (the layer leans back from a light in front of it) and draws
 * in to its resting length.
 */
export const castShadow = (angle: number) => {
  const s = standing(angle);
  return { strength: s * s, reach: 1 + (1 - s) * 1.6 };
};
