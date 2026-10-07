import { expect, test } from "@playwright/test";
import { cssLayersShown, root } from "./scene-helpers";

/**
 * The landscape behind every page: a 3D diorama where WebGL and motion are
 * welcome (scene-gl.e2e.ts), the CSS layers everywhere else. Whatever runs,
 * the visitor must end up with a settled, drawn scene.
 */

test("under reduced motion there is no 3D scene, and the CSS scene stands still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await root(page, "sceneMode")).toBeUndefined();
  await expect(page.locator(".scene-gl")).toBeHidden();
  expect(await cssLayersShown(page)).toBe(true);
});

test("where WebGL won't start, the CSS scene takes over and settles", async ({ page }) => {
  // the bundled Chromium offers WebGL 2 but can't make a context: the 3D
  // scene is attempted, fails, and must hand back to the CSS layers
  await page.goto("/");
  await expect.poll(() => root(page, "scene"), { timeout: 15_000 }).toBe("settled");
  if ((await root(page, "sceneGl")) === "on") test.skip(true, "this browser has working WebGL");
  expect(await root(page, "sceneMode")).toBeUndefined();
  await expect(page.locator(".scene-gl")).toBeHidden();
  expect(await cssLayersShown(page)).toBe(true);
});
