// Capture the Tauri Explorer web build (tauri-explorer.vercel.app) in each app
// theme the site wears (src/components/launch/appTheme.ts): one 1280x800
// window at 2x per scene, into art/raw/tauri-shots/<theme>/<scene>.png.
// scripts/shot-crops.mjs cuts the page's images from them.
//   node scripts/capture-tauri-shots.mjs [theme...]
// VIEW=WxH captures at another window size (files get a -W suffix);
// SCENES=a,b captures only those scenes. Every scene is at 2x, but those in
// DPR below, whose crop wants more pixels. quick-open-full is meant for
// VIEW=880x645 (the crop in shot-crops.mjs is measured on that window):
//   SCENES=quick-open-full VIEW=880x645 node scripts/capture-tauri-shots.mjs
// Needs system Chrome (playwright channel "chrome") and the network.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const APP = "https://tauri-explorer.vercel.app/";
const THEMES = process.argv.slice(2).length ? process.argv.slice(2) : ["solarized", "dracula", "tokyo-night", "aurora"];
const [W, H] = (process.env.VIEW ?? "1280x800").split("x").map(Number);

/** device scale factor per scene; 2 unless listed */
const DPR = { "quick-open-full": 3 };

/** each scene: what to press and type once the app is up (given the theme) */
const SCENES = {
  app: async () => {},
  "quick-open": async (p, theme) => {
    // The hero shot: the palette over the app. Staged in one respect: the
    // app's backdrop (.overlay, a navy dim at 0.42 with a 3px blur) becomes a
    // light dim in solarized's own deep teal (base02) at 0.16, so the window
    // keeps its own colours behind the palette (at 0.42 a light theme turns a
    // muddy olive, and a neutral dim a khaki one) while the palette, with the
    // app's own border and shadow, stands a step lighter. The blur stays near
    // the app's own (2.5px), so no word reads as a cut-off fragment at the
    // palette's edges; the window's shapes still do.
    await p.keyboard.press("Control+p");
    await p.waitForTimeout(400);
    await p.keyboard.type("read", { delay: 40 });
    // A light theme (solarized) is dimmed deeper (0.3): on the light site
    // the cream palette over a cream window is beige on beige, so it needs
    // the window a clear step darker behind it; still the theme's own teal,
    // not the app's navy, which turns it olive.
    const dim = theme === "solarized" ? 0.3 : 0.16;
    await p.addStyleTag({ content: `.overlay { background: rgba(7, 54, 66, ${dim}) !important; backdrop-filter: blur(2.5px) !important; }` });
  },
  "quick-open-full": async (p, theme) => {
    // The launch page's window (the Paper Diorama style's, the mock's): the
    // app at the mock's scale and proportions, legible round a palette. Its
    // window is 736 x 530 in the mock's pixels (1.39:1) with ~31px result rows
    // and ~15px type, a palette 54% of its width (400px), the sidebar and
    // the preview beside the list. The app at that scale is a ~630px window,
    // where its own layout drops the sidebar (a media query on the viewport,
    // below 861px), so the page is captured at 880x645 (VIEW=880x645) and
    // zoomed (CSS zoom, which the query ignores) until the window is 629
    // layout px wide: the app's type then stands at 1.17 of the mock's px per
    // px (the palette's rows are 15.8px of the mock's, so 12px on a 1280px
    // screen). Staged in these further respects, each a state the app has at
    // another size or a palette's own:
    //  - the sidebar is the width the mock's is, and shows its folders (the
    //    "get it" links are the site's, not a file manager's);
    //  - the status line drops its key hints, as the app does when narrow;
    //  - the palette is 400 mock px wide, its prompt and rows set to the mock's
    //    heights (ten rows of 31px), its list let run to all ten results, and
    //    it sits where the mock's does, under the toolbar;
    //  - the README preview's last line is faded out into the status line (a
    //    mask), not cut through its middle by the pane's edge;
    //  - the backdrop is a light dim in the theme's own deep colour and no
    //    blur, so the app's chrome reads crisply round the palette, which
    //    stands off the window by its own border and shadow.
    // 3x, so the cut stays sharp at the widest stage on a HiDPI screen.
    const WIN = 629; // the window, in zoomed layout px
    const pad = 20; // the page margin round the window, in CSS px
    const z = (W - 2 * pad) / WIN;
    const u = (mock) => (mock * WIN) / 736; // mock px -> zoomed layout px
    const rgb = theme === "solarized" ? "7, 54, 66" : "7, 8, 20";
    const dim = theme === "solarized" ? 0.08 : 0.1;
    await p.addStyleTag({
      content: `
        html { zoom: ${z}; }
        body { padding: ${pad / z}px !important; }
        :root { --sidebar-w: ${u(165)}px; }
        .sidebar .side-head:nth-of-type(3), .sidebar .side-head:nth-of-type(3) ~ .side-item { display: none !important; }
        .status-hints { display: none !important; }
        .preview-body { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - ${u(40)}px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - ${u(40)}px), transparent); }
        .overlay { background: rgba(${rgb}, ${dim}) !important; backdrop-filter: none !important; padding-top: ${u(121.5)}px !important; }
        .modal { width: ${u(400)}px !important; }
        .modal input { padding: ${u(7.5)}px ${u(16)}px !important; font-size: 15px; }
        .modal ul { padding: ${u(4)}px !important; max-height: none !important; }
        .modal li button { padding: ${(u(31) - 18.5) / 2}px 12px !important; }`,
    });
    await p.keyboard.press("Control+p");
    await p.waitForTimeout(400);
    await p.keyboard.type("read", { delay: 40 });
  },
  "content-search": async (p) => {
    await p.keyboard.press("Control+Shift+f");
    await p.waitForTimeout(400);
    await p.keyboard.type("git", { delay: 40 });
  },
  "command-palette": async (p) => {
    await p.keyboard.press("Control+Shift+p");
    await p.waitForTimeout(400);
    await p.keyboard.type("theme", { delay: 40 });
  },
  "git-graph": async (p) => {
    await p.getByText("Graph: this repo").first().click();
  },
};

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu"] });
for (const theme of THEMES) {
  const dir = `art/raw/tauri-shots/${theme}`;
  mkdirSync(dir, { recursive: true });
  const only = process.env.SCENES?.split(",");
  for (const [scene, act] of Object.entries(SCENES).filter(([name]) => !only || only.includes(name))) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR[scene] ?? 2 });
    const p = await ctx.newPage();
    await p.goto(APP, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const got = p.getByRole("button", { name: "Got it" });
    if (await got.isVisible().catch(() => false)) await got.click();
    // the deployed build reads no theme from the URL or storage yet
    await p.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await p.mouse.click(W / 2, H - 8); // the status bar: focus without opening anything
    await act(p, theme);
    await p.waitForTimeout(1200);
    await p.mouse.move(W - 1, H - 1);
    await p.screenshot({ path: `${dir}/${scene}${process.env.VIEW ? `-${W}` : ""}.png` });
    console.log(`${dir}/${scene}${process.env.VIEW ? `-${W}` : ""}.png`);
    await ctx.close();
  }
}
await browser.close();
