import { test, expect, describe } from "bun:test";
import {
  layoutPlane,
  project,
  cameraAt,
  overscanFor,
  hingeAngle,
  risen,
  coverScale,
  sunRect,
  type Size,
  type Overscan,
  type PlaneLayout,
} from "../src/components/rack/scene3d/framing";

const ART: Size = { w: 1920, h: 1080 };
const FOV = 30;
const RIG = { nearDepth: 4, pointerPx: 22, sink: 0.13 };
const FAR = 10;
const VIEWS: Record<string, Size> = {
  desktop: { w: 1440, h: 900 },
  ultrawide: { w: 3440, h: 1440 },
  phone: { w: 390, h: 844 },
  square: { w: 1000, h: 1000 },
};

/** world point of art UV (u, v) on a plane (v = 0 is the art's bottom) */
const artPoint = (p: PlaneLayout, u: number, v: number) => ({
  x: p.hinge.x + ((u - p.offset[0]) / p.repeat[0] - 0.5) * p.width,
  y: p.hinge.y + ((v - p.offset[1]) / p.repeat[1]) * p.height,
  z: p.hinge.z,
});

/** the screen rect CSS gives the art: cover, centred, bottom-anchored */
const cssRect = (view: Size) => {
  const s = coverScale(view, ART);
  const w = ART.w * s;
  const h = ART.h * s;
  return { left: (view.w - w) / 2, right: (view.w + w) / 2, top: view.h - h, bottom: view.h };
};

const REST = { x: 0, y: 0, z: 0 };
const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-6 * Math.max(1, Math.abs(b)));

describe("layoutPlane: at rest the 3D scene is the CSS scene", () => {
  for (const [name, view] of Object.entries(VIEWS)) {
    for (const depth of [4, 6.5, 10]) {
      test(`${name}, depth ${depth}: the art's corners land on the CSS cover rect`, () => {
        const over: Overscan = { top: 0.2, bottom: 0.1, side: 0.05 };
        const p = layoutPlane(view, ART, depth, FOV, over);
        const r = cssRect(view);
        const tl = project(view, FOV, REST, artPoint(p, 0, 1));
        const br = project(view, FOV, REST, artPoint(p, 1, 0));
        close(tl.x, r.left);
        close(tl.y, r.top);
        close(br.x, r.right);
        close(br.y, r.bottom);
      });
    }
  }

  test("layers at different depths register: the same art point lands on the same pixel", () => {
    const view = VIEWS.desktop;
    const over = overscanFor(view, ART, RIG, FAR);
    const spots = [4, 5, 6.5, 8, 10].map((d) => project(view, FOV, REST, artPoint(layoutPlane(view, ART, d, FOV, over), 0.3, 0.7)));
    for (const s of spots) {
      close(s.x, spots[0].x);
      close(s.y, spots[0].y);
    }
  });

  test("a degenerate 1px viewport and a huge one still give finite layouts", () => {
    for (const view of [{ w: 1, h: 1 }, { w: 20000, h: 12000 }]) {
      const p = layoutPlane(view, ART, 5, FOV, { top: 0.1, bottom: 0.1, side: 0.1 });
      for (const v of [p.width, p.height, p.hinge.x, p.hinge.y, p.hinge.z]) expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("sunRect: the sun sprite, placed by its disc", () => {
  const SPRITE = { w: 274, h: 236, cx: 169, cy: 96, r: 55 };
  test("the disc's centre lands on the mark, at the asked diameter", () => {
    for (const d of [34, 56, 92, 120]) {
      const at = { x: 36, y: 32 };
      const r = sunRect(SPRITE, at, d);
      const s = r.width / SPRITE.w;
      close(r.left + SPRITE.cx * s, at.x);
      close(r.top + SPRITE.cy * s, at.y);
      close(2 * SPRITE.r * s, d);
      close(r.height / r.width, SPRITE.h / SPRITE.w);
    }
  });

  test("a disc placed at least its radius from the corner lies whole in the frame", () => {
    const d = 56;
    const r = sunRect(SPRITE, { x: d / 2 + 4, y: d / 2 + 4 }, d);
    const s = r.width / SPRITE.w;
    expect(r.left + (SPRITE.cx - SPRITE.r) * s).toBeGreaterThanOrEqual(0);
    expect(r.top + (SPRITE.cy - SPRITE.r) * s).toBeGreaterThanOrEqual(0);
  });

  test("a zero or negative size gives an empty rect, not a flipped one", () => {
    expect(sunRect(SPRITE, { x: 10, y: 10 }, 0).width).toBe(0);
    expect(sunRect(SPRITE, { x: 10, y: 10 }, -5).width).toBeLessThanOrEqual(0);
  });
});

describe("overscanFor: no camera move shows a plane's edge", () => {
  for (const [name, view] of Object.entries(VIEWS)) {
    test(`${name}: at every extreme of pointer and scroll`, () => {
      const over = overscanFor(view, ART, RIG, FAR);
      const near = layoutPlane(view, ART, RIG.nearDepth, FOV, over);
      const sky = layoutPlane(view, ART, FAR, FOV, over);
      // the plane's own edges, in UV of the overscanned plane
      const edge = (p: PlaneLayout, u: number, v: number) => artPoint(p, p.offset[0] + u * p.repeat[0], p.offset[1] + v * p.repeat[1]);
      for (const px of [-1, 1])
        for (const py of [-1, 1])
          for (const scroll of [0, 1]) {
            const cam = cameraAt(view, FOV, RIG, px, py, scroll);
            // the sky is opaque everywhere, so it must fill the whole screen
            const skyTL = project(view, FOV, cam, edge(sky, 0, 1));
            const skyBR = project(view, FOV, cam, edge(sky, 1, 0));
            expect(skyTL.x).toBeLessThanOrEqual(0);
            expect(skyTL.y).toBeLessThanOrEqual(0);
            expect(skyBR.x).toBeGreaterThanOrEqual(view.w);
            expect(skyBR.y).toBeGreaterThanOrEqual(view.h);
            // the nearest layer's sides and foot never come on screen
            const nearTL = project(view, FOV, cam, edge(near, 0, 1));
            const nearBR = project(view, FOV, cam, edge(near, 1, 0));
            expect(nearTL.x).toBeLessThanOrEqual(0);
            expect(nearBR.x).toBeGreaterThanOrEqual(view.w);
            expect(nearBR.y).toBeGreaterThanOrEqual(view.h);
          }
    });
  }
});

describe("cameraAt", () => {
  const view = VIEWS.desktop;
  test("rests at the origin with the pointer centred at the top of the page", () => {
    expect(cameraAt(view, FOV, RIG, 0, 0, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });
  test("scrolling to the end sinks the nearest layer by `sink` of the viewport, the far ones less", () => {
    const cam = cameraAt(view, FOV, RIG, 0, 0, 1);
    const art = (d: number) => project(view, FOV, cam, { x: 0, y: 0, z: -d });
    const rest = (d: number) => project(view, FOV, REST, { x: 0, y: 0, z: -d });
    close(art(RIG.nearDepth).y - rest(RIG.nearDepth).y, RIG.sink * view.h);
    expect(art(FAR).y - rest(FAR).y).toBeLessThan(RIG.sink * view.h);
    expect(art(FAR).y - rest(FAR).y).toBeGreaterThan(0);
  });
  test("full pointer deflection slides the nearest layer by pointerPx", () => {
    const cam = cameraAt(view, FOV, RIG, 1, 0, 0);
    const moved = project(view, FOV, cam, { x: 0, y: 0, z: -RIG.nearDepth });
    close(Math.abs(moved.x - view.w / 2), RIG.pointerPx);
  });
  test("out-of-range input is clamped, never thrown further", () => {
    expect(cameraAt(view, FOV, RIG, 9, -9, 7)).toEqual(cameraAt(view, FOV, RIG, 1, -1, 1));
  });
});

describe("hingeAngle: the pop-up", () => {
  const rise = { delay: 200, duration: 1000 };
  test("lies flat before its delay and stands upright after it lands", () => {
    close(hingeAngle(0, rise), -Math.PI / 2);
    close(hingeAngle(200, rise), -Math.PI / 2);
    close(hingeAngle(1200, rise), 0);
    close(hingeAngle(99999, rise), 0);
  });
  test("swings past upright before settling, like a pop-up page", () => {
    const peak = Math.max(...Array.from({ length: 1000 }, (_, i) => hingeAngle(200 + i, rise)));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(0.3); // a lean, not a flip
  });
  test("risen waits for the last layer", () => {
    const rises = [rise, { delay: 600, duration: 1000 }];
    expect(risen(1300, rises)).toBe(false);
    expect(risen(1600, rises)).toBe(true);
  });
});

import { castShadow, standing } from "../src/components/rack/scene3d/framing";

describe("castShadow: a layer's shadow as it stands up", () => {
  test("lying flat casts nothing; standing casts at full strength and resting reach", () => {
    expect(castShadow(-Math.PI / 2).strength).toBe(0);
    expect(castShadow(0)).toEqual({ strength: 1, reach: 1 });
  });
  test("the overshoot past upright still counts as standing", () => {
    expect(standing(0.15)).toBe(1);
    expect(castShadow(0.15).strength).toBe(1);
  });
  test("half way up, the shadow is fainter and longer than at rest", () => {
    const half = castShadow(-Math.PI / 4);
    expect(half.strength).toBeGreaterThan(0);
    expect(half.strength).toBeLessThan(1);
    expect(half.reach).toBeGreaterThan(1);
  });
  test("an angle past flat is clamped, not extrapolated", () => {
    expect(castShadow(-Math.PI)).toEqual(castShadow(-Math.PI / 2));
  });
});
