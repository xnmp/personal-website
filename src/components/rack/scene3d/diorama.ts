/**
 * The 3D diorama: the scene's paper layers as real planes in a shadow box.
 * Loaded on demand by Scene.tsx (it pulls in three.js), and only where the
 * head script judged it welcome (motion allowed, WebGL 2, not a low-memory
 * device). The CSS scene underneath stays the fallback and the first paint.
 *
 * What it adds over the CSS scene:
 *   - depth: each layer stands at its own distance, so the pointer and the
 *     page's scroll slide them over one another with true parallax;
 *   - shadow: each layer shades the one just behind it, offset down and to
 *     the right of a soft key light from the upper left, as cut paper does
 *     in a shadow box;
 *   - the pop-up: on first load the layers hinge up from lying flat, back to
 *     front, their shadows drawing in as they stand;
 *   - air: a loose cloud drifts between the sky and the peaks, shading the
 *     sky as it passes (alpenglow), and motes of light hang in the valley
 *     (fireflies at night).
 *
 * The shadows are cast in the art's own texture space, not by a shadow map.
 * The layers stand metres apart for the parallax, and a physical light would
 * throw the near pines' shadows, shrunk by perspective, into the middle of
 * the sky. A paper shadow box has paper-thin gaps, so each layer samples the
 * layer in front of it at a small offset in their shared (registered) UV
 * frame, mapped across where a side layer is anchored apart from the layer
 * it shades (framing.ts casterMap): the shadow of a thin gap, at any parallax. It is cheap, too: no
 * shadow pass, three texture reads per pixel.
 *
 * The layer art, the finish and the motes' colour all come from kit.css
 * tokens, so a rice change re-dresses this scene the same way it does the CSS
 * one. Geometry lives in ./framing.ts.
 */
import * as THREE from "three";
import {
  COVER,
  cameraAt,
  casterMap,
  castShadow,
  hingeAngle,
  layoutPlane,
  overscanFor,
  risen,
  standing,
  sunRect,
  worldPerPx,
  type Placement,
  type Rig,
  type Rise,
  type Size,
  type SunSprite,
} from "./framing";

export const LAYERS = [
  "sky",
  "far",
  "mid",
  "near",
  "left-back",
  "right-back",
  "left",
  "right",
] as const;
type Layer = (typeof LAYERS)[number];

const ART: Size = { w: 1920, h: 1080 };
const FOV = 30;
/** depth of each layer from the camera: the spread sets the parallax */
const DEPTH: Record<Layer, number> = {
  sky: 10,
  far: 8.6,
  mid: 7,
  near: 5.6,
  // each grove is two rows of trees, the back row an arm's length behind
  "left-back": 4.95,
  "right-back": 4.9,
  left: 4.3,
  right: 4.2,
};
const RIG: Rig = { nearDepth: 4.2, pointerPx: 20, sink: 0.13 };
/** the entrance: each layer stands up, back to front. The sky is drawn
 *  whole from the first frame: the CSS sky under the canvas has already
 *  faded up, and the canvas cross-fades in over it (kit.css). */
const RISE: Record<Exclude<Layer, "sky">, Rise> = {
  far: { delay: 80, duration: 1250 },
  mid: { delay: 230, duration: 1250 },
  near: { delay: 380, duration: 1250 },
  "left-back": { delay: 520, duration: 1300 },
  "right-back": { delay: 580, duration: 1300 },
  left: { delay: 660, duration: 1300 },
  right: { delay: 730, duration: 1300 },
};

/** Who shades whom: each layer is shaded by the layer(s) just in front of it.
 *  `gap` scales the shadow's offset: how far that layer stands off. */
const CASTERS: Record<Layer, { from: Layer; gap: number }[]> = {
  sky: [{ from: "far", gap: 1.5 }],
  far: [{ from: "mid", gap: 1 }],
  mid: [{ from: "near", gap: 1 }],
  near: [
    { from: "left-back", gap: 1.2 },
    { from: "right-back", gap: 1.2 },
  ],
  "left-back": [{ from: "left", gap: 1.1 }],
  "right-back": [{ from: "right", gap: 1.1 }],
  left: [],
  right: [],
};
/** the shadow's offset per unit of gap, in art UV (x right, y up): down and
 *  to the right of a key light at the upper left, about 12px on the art */
const SHADOW = new THREE.Vector2(0.0064, -0.011);
/** how dark a full shadow makes the paper under it */
const SHADOW_DARKNESS = 0.3;
/** mip bias for the shadow reads: the blur of a soft light */
const SHADOW_SOFTNESS = 2.4;
/** how far the light leans with the pointer, as a fraction of SHADOW */
const LIGHT_LEAN = 0.35;
const CLOUD_DEPTH = 9.3;
/** the sun (moon) hangs just in front of the sky, at infinity like it */
const SUN_DEPTH = 9.9;
const CLOUD_ASPECT = 325 / 768;
/** the loose cloud hangs just off the sky: a short, faint shadow */
const CLOUD_GAP = 1.1;
const CLOUD_SHADOW = 0.6;

export type DioramaOptions = {
  /** called once the first frame is on screen, so the page can reveal it */
  onReady: () => void;
  /** called when the last layer has landed */
  onSettled: () => void;
  /** called if the scene can't run here; the page falls back to CSS */
  onFail: (why: unknown) => void;
};

type Finish = {
  /** a style may leave out any layer but the sky (kit.css: `none`) */
  layers: Record<Layer, string | null>;
  cloud: string | null;
  sun: { url: string; sprite: SunSprite } | null;
  motes: THREE.Color;
  fireflies: boolean;
};

/** a kit.css token as a number (a registered length reads back in px) */
const num = (css: CSSStyleDeclaration, name: string) => parseFloat(css.getPropertyValue(name));

/** The finish's art, read from kit.css tokens on the root element. */
function readFinish(): Finish {
  const css = getComputedStyle(document.documentElement);
  const url = (name: string) => {
    const m = css.getPropertyValue(name).match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1] : null;
  };
  const layers = Object.fromEntries(LAYERS.map((l) => [l, url(`--k-${l}`)])) as Record<Layer, string | null>;
  if (!layers.sky) throw new Error("scene token missing: --k-sky");
  const sunUrl = url("--k-sun");
  const sprite = { w: num(css, "--sun-sw"), h: num(css, "--sun-sh"), cx: num(css, "--sun-cx"), cy: num(css, "--sun-cy"), r: num(css, "--sun-r") };
  return {
    layers,
    cloud: url("--k-drift-cloud"),
    sun: sunUrl && Object.values(sprite).every(Number.isFinite) ? { url: sunUrl, sprite } : null,
    // the colour is used as written (sRGB numbers), like the art
    motes: new THREE.Color().setStyle(css.getPropertyValue("--motes").trim() || "#ffe2b8", THREE.LinearSRGBColorSpace),
    fireflies: css.getPropertyValue("--motes-kind").trim() === "fireflies",
  };
}

/** Where kit.css places each layer across the frame (framing.ts Placement):
 *  a style may anchor its left and right cut-outs to their sides
 *  (--left-anchor, --right-anchor) and hold them to --side-span frame widths.
 *  Each side's back row goes with it, as in kit.css. Every other layer
 *  covers; the shadows between layers placed apart are mapped across. */
function readPlacements(): Partial<Record<Layer, Placement>> {
  const css = getComputedStyle(document.documentElement);
  const span = num(css, "--side-span");
  const side = (name: string): Placement => {
    const anchor = num(css, name);
    return { anchor: Number.isFinite(anchor) ? anchor : COVER.anchor, span: Number.isFinite(span) && span > 0 ? span : COVER.span };
  };
  const [left, right] = [side("--left-anchor"), side("--right-anchor")];
  return { left, "left-back": left, right, "right-back": right };
}

/** Where kit.css puts the sun at this width: its disc's centre and diameter. */
function readSunAt() {
  const css = getComputedStyle(document.documentElement);
  const at = { x: num(css, "--sun-x"), y: num(css, "--sun-y") };
  const d = num(css, "--sun-d");
  return [at.x, at.y, d].every(Number.isFinite) ? { at, d } : null;
}

/** Decode an image off the main thread, flipped for WebGL, `w` px wide. */
async function bitmap(url: string, w: number) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const blob = await res.blob();
  // with only a width given, the height keeps the image's aspect
  // premultiplied, so filtering at a cut edge blends toward clear, not black
  return createImageBitmap(blob, { imageOrientation: "flipY", premultiplyAlpha: "premultiply", resizeWidth: w, resizeQuality: "high" });
}

/** The art as a texture, sampled as stored: the scene composes in the art's
 *  own sRGB numbers and writes them out unchanged, as the CSS scene does. */
function paperTexture(img: ImageBitmap, renderer: THREE.WebGLRenderer, mirrored: boolean) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false; // flipped when decoded
  t.premultiplyAlpha = false; // premultiplied when decoded
  t.wrapS = t.wrapT = mirrored ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  t.needsUpdate = true;
  return t;
}

const blank = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  t.needsUpdate = true;
  return t;
})();

/** Paper: the layer's art, shaded by up to two casters and the cloud. */
function paperMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    premultipliedAlpha: true,
    uniforms: {
      map: { value: blank },
      repeat: { value: new THREE.Vector2(1, 1) },
      offset: { value: new THREE.Vector2(0, 0) },
      opacity: { value: 1 },
      // lying back from the light, a rising layer reads a shade darker
      lit: { value: 1 },
      casterA: { value: blank },
      casterB: { value: blank },
      offA: { value: new THREE.Vector2() },
      offB: { value: new THREE.Vector2() },
      // where each caster's art lies under this layer's (framing.ts casterMap)
      mapA: { value: new THREE.Vector4(1, 1, 0, 0) },
      mapB: { value: new THREE.Vector4(1, 1, 0, 0) },
      strA: { value: 0 },
      strB: { value: 0 },
      cloudMap: { value: blank },
      cloudRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      cloudOff: { value: new THREE.Vector2() },
      cloudStr: { value: 0 },
      darkness: { value: SHADOW_DARKNESS },
      softness: { value: SHADOW_SOFTNESS },
    },
    vertexShader: /* glsl */ `
      uniform vec2 repeat, offset;
      varying vec2 vUv;
      void main() {
        vUv = uv * repeat + offset;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map, casterA, casterB, cloudMap;
      uniform vec2 offA, offB, cloudOff;
      uniform vec4 mapA, mapB, cloudRect;
      uniform float opacity, lit, strA, strB, cloudStr, darkness, softness;
      varying vec2 vUv;
      void main() {
        vec4 c = texture(map, vUv);
        if (c.a < 0.02) discard;
        float occ = texture(casterA, (vUv + offA) * mapA.xy + mapA.zw, softness).a * strA;
        occ = max(occ, texture(casterB, (vUv + offB) * mapB.xy + mapB.zw, softness).a * strB);
        vec2 cu = (vUv + cloudOff - cloudRect.xy) / cloudRect.zw;
        if (cloudStr > 0.0 && cu.x > 0.0 && cu.x < 1.0 && cu.y > 0.0 && cu.y < 1.0) {
          // the cloud's art carries its own soft drop shadow; only its paper casts
          occ = max(occ, smoothstep(0.5, 0.95, texture(cloudMap, cu, softness).a) * cloudStr);
        }
        // c is premultiplied (see bitmap), so the fade scales all four
        gl_FragColor = vec4(c.rgb * (1.0 - occ * darkness) * lit, c.a) * opacity;
      }`,
  });
}

/** Points of light drifting in the valley; all motion is in the shader. */
function makeMotes(count: number, color: THREE.Color, fireflies: boolean) {
  // a deterministic scatter, so the scene is the same on every visit
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tan = Math.tan((FOV * Math.PI) / 360);
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const d = 4.6 + rnd() * 2.2; // between the near hills and the pines
    pos[i * 3] = (rnd() * 2 - 1) * d * tan * 1.9;
    pos[i * 3 + 1] = -d * tan * (0.15 + rnd() * 0.8);
    pos[i * 3 + 2] = -d;
    phase[i] = rnd() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      color: { value: color },
      size: { value: 1 },
      blink: { value: fireflies ? 1 : 0 },
      fade: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float phase;
      uniform float time, size;
      varying float vPhase;
      void main() {
        vec3 p = position;
        float t = time * 0.00012 + phase;
        p.x += sin(t * 1.7) * 0.18 + sin(t * 0.6) * 0.1;
        p.y += sin(t * 1.3 + 1.7) * 0.09;
        vPhase = phase;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size * (34.0 / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float time, blink, fade;
      varying float vPhase;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float glow = smoothstep(1.0, 0.0, r);
        glow *= glow;
        // fireflies pulse out of step; dust motes just glint a little
        float pulse = blink > 0.5
          ? smoothstep(0.35, 1.0, sin(time * 0.0016 + vPhase * 6.2831) * 0.5 + 0.5)
          : 0.55 + 0.45 * sin(time * 0.0009 + vPhase * 6.2831);
        gl_FragColor = vec4(color * glow * pulse * fade, 1.0);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3.5; // over the near hills, under the pines
  return { points, mat };
}

/** Is this GL rasterised on the CPU? Chrome doesn't flag its SwiftShader as
 *  a performance caveat, so the renderer's name is checked as well. */
function softwareGL(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
}

export function createDiorama(canvas: HTMLCanvasElement, opts: DioramaOptions) {
  let disposed = false;
  // a GL drawn on the CPU would run the scene at a few frames a second and
  // spin the fans; there, the CSS scene is the better one (Scene.tsx falls
  // back when this throws)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
  });
  if (softwareGL(renderer.getContext())) {
    renderer.dispose();
    throw new Error("software GL");
  }
  const small = () => Math.min(window.innerWidth, window.innerHeight) < 720;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small() ? 1.5 : 1.75));
  // the art's sRGB numbers go out as they are (see paperTexture)
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);

  // one hinge group per layer: the plane hangs above its bottom edge
  type Plane = { hinge: THREE.Group; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; tex: THREE.Texture | null };
  const planes = new Map<Layer, Plane>();
  for (const layer of LAYERS) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), paperMaterial());
    mesh.renderOrder = LAYERS.indexOf(layer);
    const hinge = new THREE.Group();
    hinge.add(mesh);
    scene.add(hinge);
    planes.set(layer, { hinge, mesh, tex: null });
  }
  const sky = planes.get("sky")!;

  // a loose cloud drifting between the sky and the peaks
  const cloudMat = paperMaterial();
  const cloud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cloudMat);
  cloud.visible = false;
  cloud.renderOrder = 0.5;
  scene.add(cloud);
  let cloudTex: THREE.Texture | null = null;

  // the sun (moon), cut out of the sky so it can sit whole in the frame's
  // upper-left margin at every width (kit.css .scene-sun)
  const sunMat = paperMaterial();
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunMat);
  sun.visible = false;
  sun.renderOrder = 0.25;
  scene.add(sun);
  let sunTex: THREE.Texture | null = null;
  let sunSprite: SunSprite | null = null;
  /** where the sun hangs with the camera at rest */
  const sunRest = new THREE.Vector3();

  let motes: ReturnType<typeof makeMotes> | null = null;

  let view: Size = { w: 1, h: 1 };
  /** where the sky hangs with the camera at rest (see the loop) */
  const skyRest = new THREE.Vector3();
  const layout = () => {
    const over = overscanFor(view, ART, RIG, DEPTH.sky);
    const placed = readPlacements();
    const at = (l: Layer) => placed[l] ?? COVER;
    for (const [layer, { hinge, mesh }] of planes) {
      const p = layoutPlane(view, ART, DEPTH[layer], FOV, over, at(layer));
      const u = mesh.material.uniforms;
      hinge.position.set(p.hinge.x, p.hinge.y, p.hinge.z);
      mesh.scale.set(p.width, p.height, 1);
      mesh.position.set(0, p.height / 2, 0);
      u.repeat.value.set(...p.repeat);
      u.offset.value.set(...p.offset);
      const [a, b] = CASTERS[layer];
      if (a) u.mapA.value.set(...casterMap(view, ART, at(layer), at(a.from)));
      if (b) u.mapB.value.set(...casterMap(view, ART, at(layer), at(b.from)));
    }
    skyRest.copy(sky.hinge.position);
    const sunAt = readSunAt();
    sun.visible = !!(sunTex && sunSprite && sunAt);
    if (sunSprite && sunAt) {
      const r = sunRect(sunSprite, sunAt.at, sunAt.d);
      const ks = worldPerPx(SUN_DEPTH, FOV, view.h);
      sun.scale.set(r.width * ks, r.height * ks, 1);
      sunRest.set((r.left + r.width / 2 - view.w / 2) * ks, (view.h / 2 - (r.top + r.height / 2)) * ks, -SUN_DEPTH);
    }
    const k = (2 * CLOUD_DEPTH * Math.tan((FOV * Math.PI) / 360)) / view.h;
    const cw = Math.min(320, view.w * 0.2) * k;
    cloud.scale.set(cw, cw * CLOUD_ASPECT, 1);
    // below the masthead strip, so it never reads as a tab hanging off it
    cloud.position.y = (view.h / 2 - view.h * 0.2) * k;
    cloud.position.z = -CLOUD_DEPTH;
  };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    view = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  };

  // wire each layer's casters once; their maps are set as the art loads
  const wireCasters = () => {
    for (const [layer, { mesh }] of planes) {
      const u = mesh.material.uniforms;
      const [a, b] = CASTERS[layer];
      u.casterA.value = (a && planes.get(a.from)!.tex) || blank;
      u.casterB.value = (b && planes.get(b.from)!.tex) || blank;
    }
    sky.mesh.material.uniforms.cloudMap.value = cloudTex ?? blank;
  };

  // ---- input: the pointer (where there is one) and the page's scroll ----
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0, scroll: 0 };
  const onPointer = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (fine) window.addEventListener("pointermove", onPointer, { passive: true });
  const scrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  };

  // ---- the finish: load its art, and reload on a rice or page change ----
  let finishKey = "";
  let loadToken = 0;
  const applyFinish = async () => {
    const f = readFinish();
    const keyNow = JSON.stringify([f.layers, f.cloud, f.sun, f.motes.getHexString(), f.fireflies]);
    if (keyNow === finishKey) return;
    finishKey = keyNow;
    const token = ++loadToken;
    const texW = small() ? 1280 : 1920;
    const [imgs, cloudImg, sunImg] = await Promise.all([
      Promise.all(LAYERS.map((l) => (f.layers[l] ? bitmap(f.layers[l], texW) : Promise.resolve(null)))),
      f.cloud ? bitmap(f.cloud, 512) : Promise.resolve(null),
      f.sun ? bitmap(f.sun.url, f.sun.sprite.w) : Promise.resolve(null),
    ]);
    if (disposed || token !== loadToken) {
      imgs.forEach((i) => i?.close());
      cloudImg?.close();
      sunImg?.close();
      return;
    }
    sunTex?.dispose();
    sunTex = sunImg ? paperTexture(sunImg, renderer, false) : null;
    sunMat.uniforms.map.value = sunTex ?? blank;
    sunSprite = f.sun?.sprite ?? null;
    LAYERS.forEach((l, i) => {
      const p = planes.get(l)!;
      p.tex?.dispose();
      const img = imgs[i];
      p.tex = img ? paperTexture(img, renderer, true) : null;
      p.mesh.material.uniforms.map.value = p.tex ?? blank;
      p.mesh.visible = !!p.tex;
    });
    cloudTex?.dispose();
    cloudTex = cloudImg ? paperTexture(cloudImg, renderer, false) : null;
    cloudMat.uniforms.map.value = cloudTex ?? blank;
    cloud.visible = !!cloudTex;
    wireCasters();
    if (motes) {
      scene.remove(motes.points);
      motes.points.geometry.dispose();
      motes.mat.dispose();
    }
    motes = makeMotes(small() ? 22 : 46, f.motes, f.fireflies);
    scene.add(motes.points);
    layout();
  };

  // a lost context (a GPU reset, the driver reclaiming memory) leaves the
  // canvas blank: hand the scene back to the CSS layers
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onFail(new Error("WebGL context lost"));
  };
  canvas.addEventListener("webglcontextlost", onLost);

  // a change to a style whose scene is a single plate hands the scene back to
  // the CSS, which registers that plate to the page (lib/styles.ts SceneArt)
  const rice = new MutationObserver(() =>
    document.documentElement.dataset.sceneArt === "plate"
      ? opts.onFail(new Error("this style's scene is a plate"))
      : applyFinish().catch(opts.onFail),
  );
  rice.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rice", "data-style"] });
  // a style may dress its inner pages' scene its own way (kit tokens under
  // :root:has(...)), so a move to another page re-reads the finish; the same
  // art is not reloaded (applyFinish keys on it)
  const page = new MutationObserver(() => applyFinish().catch(opts.onFail));
  const column = document.querySelector(".rack-inner");
  if (column) page.observe(column, { childList: true });

  // ---- the loop ----
  // a style may dress the scene for a narrow screen its own way (kit tokens
  // under a media query), so a resize re-reads the finish too (keyed: the
  // same art is not reloaded)
  const ro = new ResizeObserver(() => {
    resize();
    applyFinish().catch(opts.onFail);
  });
  ro.observe(canvas);
  let start = -1;
  let settled = false;
  let raf = 0;
  const rises = Object.values(RISE);
  const tan = Math.tan((FOV * Math.PI) / 360);
  const light = new THREE.Vector2();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (start < 0) start = now;
    const t = now - start;

    // input, eased
    const ease = fine ? 0.045 : 0;
    eased.x += (target.x - eased.x) * ease;
    eased.y += (target.y - eased.y) * ease;
    eased.scroll += (scrollProgress() - eased.scroll) * 0.12;

    // the light leans a touch with the pointer, so the shadows breathe
    light.set(SHADOW.x * (1 - eased.x * LIGHT_LEAN), SHADOW.y * (1 + eased.y * LIGHT_LEAN));

    // the pop-up
    const angle = (l: Layer) => (l === "sky" ? 0 : hingeAngle(t, RISE[l]));
    for (const [layer, { hinge, mesh }] of planes) {
      const u = mesh.material.uniforms;
      const a = angle(layer);
      if (layer !== "sky") {
        const r = RISE[layer];
        hinge.rotation.x = a;
        // paper is opaque: a layer isn't there until its hinge starts, then
        // stands up whole (lying flat it is edge-on, so it doesn't pop)
        mesh.visible = t >= r.delay;
        u.lit.value = 0.84 + 0.16 * standing(a);
      }
      // the casters' shadows on this layer: sample each caster up and to the
      // left, so its shadow falls down and to the right
      const [ca, cb] = CASTERS[layer];
      for (const [c, off, str] of [
        [ca, u.offA, u.strA],
        [cb, u.offB, u.strB],
      ] as const) {
        if (!c) continue;
        const s = castShadow(angle(c.from));
        off.value.set(-light.x * c.gap * s.reach, -light.y * c.gap * s.reach);
        str.value = s.strength;
      }
    }

    // the camera starts a little closer and lower, and eases back as the
    // book opens, so the scene seems to unfold toward you
    const settle = 1 - Math.pow(1 - Math.min(1, t / 2200), 3);
    const c = cameraAt(view, FOV, RIG, eased.x, eased.y, eased.scroll);
    camera.position.set(c.x, c.y - (1 - settle) * 0.25, c.z - (1 - settle) * 0.55);
    // the sky and the sun are at infinity: they travel with the camera, so
    // they hold still on screen as the CSS ones do, and the sky's edge (where
    // the art would have to be mirrored) never comes into view
    sky.hinge.position.copy(skyRest).add(camera.position);
    sun.position.copy(sunRest).add(camera.position);

    // the cloud drifts right across the frame over two and a half minutes,
    // and shades the sky where it passes
    // not on a phone-wide screen, as the CSS cloud (kit.css)
    cloud.visible = !!cloudTex && view.w > 720;
    if (!cloud.visible) sky.mesh.material.uniforms.cloudStr.value = 0;
    else {
      const span = (2 * CLOUD_DEPTH * tan * view.w) / view.h + cloud.scale.x * 2;
      cloud.position.x = (((t / 150000 + 0.27) % 1) - 0.5) * span;
      const fade = Math.min(1, Math.max(0, (t - 900) / 900));
      cloudMat.uniforms.opacity.value = fade;
      // the cloud's silhouette as the camera sees it against the sky, in the
      // sky's art UV: the shadow then sits just off the cloud at any parallax
      const su = sky.mesh.material.uniforms;
      const cam = camera.position;
      const grow = (cam.z + DEPTH.sky) / (cam.z + CLOUD_DEPTH);
      const onSky = (x: number, y: number) => ({ x: cam.x + (x - cam.x) * grow, y: cam.y + (y - cam.y) * grow });
      const lo = onSky(cloud.position.x - cloud.scale.x / 2, cloud.position.y - cloud.scale.y / 2);
      const sw = sky.mesh.scale.x;
      const sh = sky.mesh.scale.y;
      const x0 = (lo.x - (sky.hinge.position.x - sw / 2)) / sw;
      const y0 = (lo.y - sky.hinge.position.y) / sh;
      su.cloudRect.value.set(
        x0 * su.repeat.value.x + su.offset.value.x,
        y0 * su.repeat.value.y + su.offset.value.y,
        ((cloud.scale.x * grow) / sw) * su.repeat.value.x,
        ((cloud.scale.y * grow) / sh) * su.repeat.value.y,
      );
      su.cloudOff.value.set(-light.x * CLOUD_GAP, -light.y * CLOUD_GAP);
      su.cloudStr.value = fade * CLOUD_SHADOW;
    }
    if (motes) {
      motes.mat.uniforms.time.value = now;
      motes.mat.uniforms.size.value = renderer.getPixelRatio() * (small() ? 1.6 : 1.9);
      motes.mat.uniforms.fade.value = Math.min(1, Math.max(0, (t - 1400) / 1200));
    }

    if (!settled && risen(t, rises)) {
      settled = true;
      opts.onSettled();
    }

    renderer.render(scene, camera);
    if (t === 0) opts.onReady();
  };

  if (process.env.NODE_ENV !== "production") Object.assign(window, { __diorama: { scene, renderer, camera, planes } });

  resize();
  applyFinish()
    .then(() => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
    })
    .catch(opts.onFail);

  return function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    rice.disconnect();
    page.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    for (const p of planes.values()) p.tex?.dispose();
    cloudTex?.dispose();
    sunTex?.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    renderer.dispose();
  };
}
