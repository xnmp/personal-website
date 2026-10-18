import { expect, test, type Page } from "@playwright/test";
import { projects } from "../src/data/projects";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });

const styleKey = (page: Page) => page.getByRole("button", { name: /^Art direction/ });
const openStyleMenu = async (page: Page) => {
  const trigger = styleKey(page);
  await expect.poll(() => trigger.evaluate(element => Boolean((element as HTMLButtonElement).popoverTargetElement))).toBe(true);
  await trigger.click();
};
const choose = async (page: Page, name: string) => {
  await openStyleMenu(page);
  await page.getByRole("menuitemradio", { name, exact: true }).click();
};
const seed = (page: Page, rice = "paper") => page.addInitScript((r) => {
  localStorage.setItem("nb-style", "margin");
  localStorage.setItem("nb-rice", r);
}, rice);

test("Margin Index can be selected, survives navigation and reload, and can be switched back", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("nb-style")) localStorage.setItem("nb-style", "paper");
  });
  await page.goto("/projects");
  await choose(page, "Margin Index");
  await expect(page.locator(".margin-index")).toBeVisible();
  await expect(page.locator(".landing")).toBeHidden();
  await page.getByRole("link", { name: "Scrivo", exact: true }).click();
  await expect(page).toHaveURL(/\/p\/scrivo$/);
  await page.reload();
  await expect(styleKey(page)).toHaveAccessibleName("Art direction: Margin Index");
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await expect(page.locator(".margin-index")).toBeVisible();
  await choose(page, "Paper Diorama");
  await expect(page.locator(".margin-index")).toBeHidden();
  await expect(page.locator(".landing")).toBeVisible();
});

test("the complete Markdown catalogue is navigable without generated kit assets", async ({ page }) => {
  const kit: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/kit/")) kit.push(request.url()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await seed(page);
  await page.goto("/projects", { waitUntil: "networkidle" });
  for (const p of projects) {
    const link = page.getByRole("link", { name: p.title, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", p.href);
    await expect(page.locator(".margin-entry").filter({ has: link })).toContainText(p.summary ?? p.heading);
  }
  await expect(page.locator("html")).toHaveAttribute("data-scene-art", "none");
  await expect(page.locator(".scene")).toBeHidden();
  await page.getByRole("link", { name: "About me" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi, I’m Chong");
  expect(kit).toEqual([]);
  expect(errors).toEqual([]);
});

test("the directory and reading pages fit narrow phones, tablets and desktop", async ({ page }) => {
  await seed(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 701, 900, 1448]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/projects", "/about", "/p/tauri-explorer", "/p/zheng-shang-you/play"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${route} at ${width}`).toBeLessThanOrEqual(width);
      await expect(styleKey(page)).toBeVisible();
      await openStyleMenu(page);
      const menu = page.getByRole("menu", { name: "Art direction" });
      const bounds = (await menu.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      await page.keyboard.press("Escape");
    }
  }
});

test("keyboard navigation opens the visible directory entry and search still finds projects", async ({ page, isMobile }) => {
  test.skip(isMobile, "physical keyboard");
  await seed(page);
  await page.goto("/projects");
  await expect(styleKey(page)).toHaveAccessibleName("Art direction: Margin Index");
  await page.keyboard.press("j");
  await expect(page.locator(".margin-list h3 a").first()).toBeFocused();
  await page.keyboard.press("j");
  await expect(page.getByRole("link", { name: "Scrivo", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/p\/scrivo$/);
  await page.keyboard.press("/");
  await page.getByRole("combobox").fill("Ballast");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/p\/ballast$/);
});

test("real screenshots follow the colour theme and alpha/live links still work", async ({ page }) => {
  await seed(page);
  await page.goto("/projects");
  const shot = page.locator(".margin-capture img:visible");
  await expect(shot).toHaveAttribute("src", /solarized/);
  await expect.poll(() => shot.evaluate((e) => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await page.getByRole("menuitemradio", { name: "horizon", exact: true }).click();
  await expect(shot).not.toHaveAttribute("src", /solarized/);
  await page.getByRole("link", { name: "Tauri Explorer", exact: true }).click();
  await page.getByRole("link", { name: "Try it live", exact: true }).first().click();
  await expect(page).toHaveURL(/\/p\/tauri-explorer#live$/);
  await expect(page.locator("#live")).toBeVisible();
  await expect(page.getByRole("link", { name: "Join the alpha", exact: true }).first()).toHaveAttribute("href", /^mailto:/);
});

test("child pages keep a visible path back to the project", async ({ page }) => {
  await seed(page);
  await page.goto("/p/zheng-shang-you/play");
  const parent = page.locator('.head-nav a[href="/p/zheng-shang-you"]');
  await expect(parent).toBeVisible();
  await parent.click();
  await expect(page).toHaveURL(/\/p\/zheng-shang-you$/);
});

test("the rail menu remains fully usable on short screens", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 900, height: 390 });
  await page.goto("/projects");
  await openStyleMenu(page);
  const menu = page.getByRole("menu", { name: "Art direction" });
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(390);
  await page.getByRole("menuitemradio", { name: "Paper Diorama", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-style", "paper");
});

test("new visitors get Margin Index while a saved style takes precedence", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("html")).toHaveAttribute("data-style", "margin");
  await expect(page.locator(".margin-index")).toBeVisible();
  await expect(page.locator(".scene")).toBeHidden();
  await choose(page, "Paper Diorama");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-style", "paper");
  await expect(page.locator(".landing")).toBeVisible();
});

test("the About file index moves to the corresponding authored section", async ({ page }) => {
  await seed(page);
  await page.goto("/about");
  const index = page.getByRole("navigation", { name: "On this page" });
  await index.getByRole("link", { name: "Setup", exact: true }).click();
  await expect(page).toHaveURL(/#about-section-1$/);
  await expect(page.locator("#about-section-1 h2")).toBeInViewport();
  await expect(page.locator(".about-file-head a")).toHaveAttribute("href", "https://github.com/xnmp/personal-website/blob/main/content/about.md");
});

for (const editing of [false, true]) {
  test(`section headings stay clear of the body while scrolling in ${editing ? "editing" : "preview"} mode`, async ({ page }) => {
    test.skip(editing && !process.env.STUDIO_E2E, "Editing requires the opted-in local studio");
    await seed(page, "solarized-light");
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    if (editing) await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const section = page.locator("#about-section-0");
    const heading = section.locator(":scope > div").first();
    const body = section.locator(":scope > div").last();
    for (const width of [900, 901, 1000, 1050, 1051, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await body.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 20, behavior: "instant" }));
      if (width === 1000) await page.screenshot({ path: test.info().outputPath("section-scroll.png") });
      const head = (await heading.boundingBox())!;
      const copy = (await body.boundingBox())!;
      if (width <= 1050) expect(head.y + head.height, `stacked at ${width}`).toBeLessThanOrEqual(copy.y + 1);
      else expect(head.x + head.width, `columns at ${width}`).toBeLessThanOrEqual(copy.x + 1);
    }
  });
}
