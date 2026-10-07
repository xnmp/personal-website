import { describe, expect, test } from "bun:test";
import { APP_THEME, WEB_THEMES, appThemeFor, demoUrl } from "../src/components/launch/appTheme";
import { RICES } from "../src/components/instrument/CommandIndex";

describe("the app theme that wears each rice", () => {
  test("every rice has one, and the live web build ships it", () => {
    for (const rice of RICES) expect(WEB_THEMES).toContain(appThemeFor(rice));
  });
  test("the light rice gets a light app theme, the dark rices dark ones", () => {
    const light = ["light", "solarized"]; // the web build's themes on a light ground
    expect(light).toContain(appThemeFor("paper"));
    for (const rice of RICES.filter((r) => r !== "paper")) expect(light).not.toContain(appThemeFor(rice));
  });
  test("a missing or unknown rice falls back to the paper one", () => {
    for (const r of [undefined, null, "", "constructor", "nonsense"]) expect(appThemeFor(r)).toBe(APP_THEME.paper);
  });
  test("the demo URL asks the web build for the theme", () => {
    expect(new URL(demoUrl("aurora")).searchParams.get("theme")).toBe("aurora");
  });
});
