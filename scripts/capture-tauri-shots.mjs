// Capture the Tauri Explorer web build (tauri-explorer.vercel.app) in each app
// theme the site wears (src/components/launch/appTheme.ts): one 1280x800
// window at 2x per scene, into art/raw/tauri-shots/<theme>/<scene>.png.
// scripts/shot-crops.mjs cuts the page's images from them.
//   node scripts/capture-tauri-shots.mjs [theme...]
// VIEW=WxH captures at another window size (files get a -W suffix);
// SCENES=a,b captures only those scenes.
// Needs system Chrome (playwright channel "chrome") and the network.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const APP = "https://tauri-explorer.vercel.app/";
const THEMES = process.argv.slice(2).length ? process.argv.slice(2) : ["solarized", "dracula", "tokyo-night", "aurora"];
const [W, H] = (process.env.VIEW ?? "1280x800").split("x").map(Number);

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
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
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
