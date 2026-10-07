import { expect, test } from "@playwright/test";
import { sceneStats, cssLayersShown, root } from "./scene-helpers";

/**
 * The 3D diorama, where WebGL and motion are welcome. It wants a GPU (on a
 * software GL the CSS scene runs instead), and Playwright's bundled Chromium
 * has none, so these run in the system Chrome with its GPU switched on. On a
 * machine without Chrome or a GPU they skip.
 */
test.use({ channel: "chrome", launchOptions: { args: ["--enable-gpu"] } });
test.skip(({ isMobile }) => isMobile, "the system Chrome stands in for a desktop browser");
test.beforeEach(async ({ page }) => {
  await page.goto("about:blank");
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  });
  test.skip(!renderer || /swiftshader|llvmpipe|software/i.test(renderer), "no GPU for WebGL here");
});

test("the diorama draws the landscape and settles", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => root(page, "sceneGl"), { timeout: 15_000 }).toBe("on");
  await expect(page.locator(".scene-gl")).toBeVisible();
  await expect.poll(() => root(page, "scene"), { timeout: 15_000 }).toBe("settled");
  // a drawn painting, not a cleared buffer
  expect((await sceneStats(page)).colours).toBeGreaterThan(40);
  // the canvas stands in for the CSS layers, so they are not drawn twice
  expect(await cssLayersShown(page)).toBe(false);
});

test("switching the rice re-dresses the 3D scene", async ({ page }) => {
  // from the one day finish (alpenglow) to a night one; the dark rices
  // share the night scene, so a switch between two of them changes nothing
  await page.addInitScript(() => localStorage.getItem("nb-rice") ?? localStorage.setItem("nb-rice", "paper"));
  await page.goto("/");
  await expect.poll(() => root(page, "scene"), { timeout: 15_000 }).toBe("settled");
  const before = await sceneStats(page);
  await page.getByRole("button", { name: /Switch theme/ }).click();
  await expect
    .poll(async () => {
      const { mean } = await sceneStats(page);
      return Math.max(...mean.map((v, i) => Math.abs(v - before.mean[i])));
    }, { timeout: 15_000 })
    .toBeGreaterThan(12);
  expect(await root(page, "sceneGl")).toBe("on");
});

test("a visitor who opted for the flat scene gets the CSS layers", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nb-scene", "flat"));
  await page.goto("/");
  await expect.poll(() => root(page, "scene"), { timeout: 15_000 }).toBe("settled");
  expect(await root(page, "sceneMode")).toBeUndefined();
  await expect(page.locator(".scene-gl")).toBeHidden();
  expect(await cssLayersShown(page)).toBe(true);
});

test("if the GPU drops the scene's context, the CSS scene takes over", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => root(page, "sceneGl"), { timeout: 15_000 }).toBe("on");
  // what a GPU reset does: the canvas's context is lost
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>(".scene-gl")!.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect.poll(() => root(page, "sceneMode")).toBeUndefined();
  await expect(page.locator(".scene-gl")).toBeHidden();
  expect(await cssLayersShown(page)).toBe(true);
});
