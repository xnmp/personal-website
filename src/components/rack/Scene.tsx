"use client";

import { Fragment, type AnimationEvent } from "react";

/** The scene's paper layers, back to front (art in kit.css: --k-<layer>). */
export const SCENE_LAYERS = [
  "sky",
  "mountains",
  "hills-far",
  "hills-near",
  "pines-left-back",
  "pines-right-back",
  "pines-left",
  "pines-right",
] as const;

/** The last layer to land; when it does, the scene is settled. */
const LAST = SCENE_LAYERS[SCENE_LAYERS.length - 1];

/** How long the 3D scene may take to show its first frame before the CSS
 *  scene takes over (slow network, slow GPU). The page's sheets wait for it
 *  (kit.css), so this is also the longest they can be held back. */
const GL_START_BUDGET_MS = 2500;

/**
 * Ref callback for the canvas: boot the 3D diorama (scene3d/diorama.ts) when
 * the head script chose it (data-scene-mode="3d": motion allowed, WebGL 2,
 * not a low-memory device). three.js is fetched only here, so a visitor who
 * gets the CSS scene never downloads it. Any failure, or a start slower than
 * the budget, drops the mode, and the CSS layers rise instead.
 */
function mountDiorama(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const root = document.documentElement;
  if (root.dataset.sceneMode !== "3d") return;
  let dispose: (() => void) | null = null;
  let cancelled = false;
  let timer = 0;
  const fallback = (why: unknown) => {
    if (cancelled) return;
    console.warn("[scene] 3D scene off, using the CSS scene:", why);
    cancelled = true;
    window.clearTimeout(timer);
    dispose?.();
    dispose = null;
    delete root.dataset.sceneGl;
    delete root.dataset.sceneMode;
  };
  timer = window.setTimeout(() => {
    if (root.dataset.sceneGl !== "on") fallback("slow start");
  }, GL_START_BUDGET_MS);
  import("./scene3d/diorama").then(({ createDiorama }) => {
    if (cancelled) return;
    try {
      dispose = createDiorama(canvas, {
        onReady: () => {
          window.clearTimeout(timer);
          root.dataset.sceneGl = "on";
        },
        onSettled: () => {
          root.dataset.scene = "settled";
        },
        onFail: fallback,
      });
    } catch (e) {
      fallback(e);
    }
  }, fallback);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    dispose?.();
    dispose = null;
    delete root.dataset.sceneGl;
  };
}

/**
 * The landscape behind every page. Its CSS layers are the first paint and
 * the fallback; where the 3D diorama runs, it draws the same layers on the
 * canvas over them, in depth and in light.
 *
 * When the CSS layers' entrance finishes (the last layer has risen), the page
 * is marked settled, so sheets on later pages come in without waiting for
 * it. The 3D scene marks it the same way when its last layer lands.
 */
export function Scene() {
  const settle = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === "layer-rise" && (e.target as HTMLElement).dataset.layer === LAST) {
      document.documentElement.dataset.scene = "settled";
    }
  };
  return (
    <div className="scene" aria-hidden onAnimationEnd={settle}>
      {SCENE_LAYERS.map((layer) => (
        <Fragment key={layer}>
          <div className="scene-layer" data-layer={layer} />
          {/* the sun (moon) hangs in the sky, in front of it, behind the peaks */}
          {layer === "sky" ? <div className="scene-sun" /> : null}
        </Fragment>
      ))}
      <canvas className="scene-gl" ref={mountDiorama} />
    </div>
  );
}
