import type { RICES } from "@/components/instrument/CommandIndex";

type Rice = (typeof RICES)[number];

/**
 * The app theme that wears each of the site's rices. The product screens on
 * the Tauri Explorer page are the real app (captures and its live web build),
 * not mock-ups, so instead of recolouring them they switch to the app's own
 * theme nearest the rice: solarized (light, on cream) for paper, and the
 * dark theme whose ground and accent are closest for each dark rice. Only themes the web build ships
 * (`WEB_THEMES`) can be used, so the live demo can boot into the same one.
 */
export const APP_THEME = {
  paper: "solarized",
  horizon: "dracula",
  "cosmic-dusk": "tokyo-night",
  rapture: "aurora",
} as const satisfies Record<Rice, string>;

export type AppTheme = (typeof APP_THEME)[Rice];

/** Themes the deployed web build carries (light is its unthemed default). */
export const WEB_THEMES = [
  "light",
  "aurora",
  "hacker",
  "solarized",
  "dark",
  "ayu-mirage",
  "monokai",
  "dracula",
  "nord",
  "gruvbox",
  "one-dark",
  "tokyo-night",
  "catppuccin",
] as const;

/** The app theme for a rice; an unknown or missing rice gets the paper one. */
export const appThemeFor = (rice: string | null | undefined): AppTheme =>
  rice && Object.hasOwn(APP_THEME, rice) ? APP_THEME[rice as Rice] : APP_THEME.paper;

/** The live web build, booting into the given app theme. */
export const demoUrl = (theme: AppTheme) => `https://tauri-explorer.vercel.app/?theme=${theme}`;

/**
 * The page's captures of one scene of the app in one theme, as cut by
 * scripts/shot-crops.mjs: the crop, its tighter phone crop, and the whole
 * window at 1x and 2x.
 */
export const shotFiles = (scene: string, theme: AppTheme) => ({
  crop: `/tauri/crop-${scene}-${theme}.webp`,
  phone: `/tauri/crop-${scene}-phone-${theme}.webp`,
  full: `/tauri/live-${scene}-${theme}.webp`,
  full2x: `/tauri/live-${scene}-${theme}@2x.webp`,
});
