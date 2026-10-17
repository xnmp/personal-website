import { describe, expect, test } from "bun:test";
import { APP_THEME, WEB_THEMES, appThemeFor, demoUrl, shotFiles } from "../src/components/launch/appTheme";
import { existsSync } from "node:fs";
import { RICES, riceMode } from "../src/lib/rice";

describe("the app theme that wears each rice", () => {
  test("every rice has one, and the live web build ships it", () => {
    for (const rice of RICES) expect(WEB_THEMES).toContain(appThemeFor(rice));
  });
  test("the light rice gets a light app theme, the dark rices dark ones", () => {
    const light = ["light", "solarized"]; // the web build's themes on a light ground
    for (const rice of RICES.filter((r) => riceMode(r) === "light")) expect(light).toContain(appThemeFor(rice));
    for (const rice of RICES.filter((r) => riceMode(r) === "dark")) expect(light).not.toContain(appThemeFor(rice));
  });
  test("a missing or unknown rice falls back to the paper one", () => {
    for (const r of [undefined, null, "", "constructor", "nonsense"]) expect(appThemeFor(r)).toBe(APP_THEME.paper);
  });
  test("the demo URL asks the web build for the theme", () => {
    expect(new URL(demoUrl("aurora")).searchParams.get("theme")).toBe("aurora");
  });
  test("every palette has all product images required by the directory, gallery and live demo", () => {
    for (const theme of new Set(Object.values(APP_THEME))) {
      const paths = [
        `/tauri/hero-quick-open-${theme}.webp`, `/tauri/hero-quick-open-strip-${theme}.webp`,
        `/tauri/hero-quick-open-wide-${theme}.webp`, `/tauri/live-app-${theme}.webp`,
        ...["content-search", "command-palette", "git-graph"].flatMap(scene => Object.values(shotFiles(scene, theme))),
      ];
      for (const path of paths) expect(existsSync(`public${path}`), path).toBe(true);
    }
  });
});
