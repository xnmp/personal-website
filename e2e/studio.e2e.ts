import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test.use({ channel: "chrome" });
test.skip(!process.env.STUDIO_E2E, "Run only against the opted-in local studio with one worker");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); localStorage.setItem("nb-rice", "ayu-mirage"); });
  page.on("dialog", (dialog) => dialog.accept());
});

test("edits the actual pages, saves exact Markdown and deploys from the bottom-left", async ({ page }) => {
  const originals = new Map(await Promise.all(["home", "about", "projects/scrivo"].map(async (id) => [id, await readFile(`content/${id}.md`, "utf8")] as const)));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".margin-index")).toBeVisible();
    await expect(page.locator("iframe, .studio-shell, .studio-block")).toHaveCount(0);
    for (const scenario of [
      { route: "/", document: "home", field: "margin intro", value: "A **private garden**, edited in place.", visible: "A private garden, edited in place." },
      { route: "/about", document: "about", field: "intro", value: "An introduction with [a project](/p/scrivo).\n\nStill the actual About page.", visible: "Still the actual About page." },
      { route: "/p/scrivo", document: "projects/scrivo", field: "headline", value: "A locally edited Scrivo headline.", visible: "A locally edited Scrivo headline." },
    ]) {
      await page.goto(scenario.route);
      await page.getByRole("button", { name: `Edit ${scenario.field}`, exact: true }).click();
      const input = page.getByRole("textbox", { name: scenario.field, exact: true });
      await expect(input).toBeFocused();
      await input.fill(scenario.value);
      await input.press("Control+Enter");
      await expect(page.getByText(scenario.visible, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Save locally", exact: true }).click();
      await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
      expect(await readFile(`content/${scenario.document}.md`, "utf8")).toContain(scenario.value);
      await page.reload();
      await expect(page.getByText(scenario.visible, { exact: true })).toBeVisible();
    }
    await page.goto("/");
    // A linked title edits in place; Browsing restores the actual site's navigation.
    const title = page.locator('.margin-entry h3 [data-studio-document="projects/scrivo"]');
    await expect(title).toHaveAttribute("role", "button");
    await title.click();
    await page.getByRole("textbox", { name: "title", exact: true }).fill("Scrivo, edited locally");
    await page.getByRole("textbox", { name: "title", exact: true }).press("Enter");
    let deployRequests = 0;
    await page.route("**/api/studio", async (route) => {
      if (route.request().method() === "POST" && route.request().postDataJSON().action === "deploy") {
        deployRequests++;
        expect(await readFile("content/projects/scrivo.md", "utf8")).toContain("Scrivo, edited locally");
        await route.fulfill({ json: { job: { phase: "live", message: "Mock publication accepted", url: "https://example.invalid" } } });
      } else await route.continue();
    });
    await page.getByRole("button", { name: "Deploy", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Mock publication accepted");
    expect(deployRequests).toBe(1);
    const bounds = (await page.locator(".studio-deploy").boundingBox())!;
    expect(bounds.x).toBeLessThan(30);
    expect(bounds.y + bounds.height).toBeGreaterThan(page.viewportSize()!.height - 30);
    await page.getByRole("button", { name: "Editing", exact: true }).click();
    await page.locator('.margin-entry h3 a[href="/p/scrivo"]').click();
    await expect(page).toHaveURL(/\/p\/scrivo$/);
    await expect(page.locator(".kicker")).toContainText("Scrivo, edited locally");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await page.waitForLoadState("networkidle").catch(() => {});
    for (const [id, source] of originals) await writeFile(`content/${id}.md`, source, "utf8");
  }
});

test("recovers other pages' drafts and refuses to overwrite an external edit", async ({ page }) => {
  const original = await readFile("content/about.md", "utf8");
  try {
    await page.goto("/about");
    const headline = page.getByRole("button", { name: "Edit headline", exact: true });
    await headline.focus();
    await expect(headline).toBeFocused();
    await headline.press("Enter");
    await expect(page.getByRole("textbox", { name: "headline", exact: true })).toBeFocused();
    await page.getByRole("textbox", { name: "headline", exact: true }).press("Escape");
    await page.getByRole("button", { name: "Edit intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("Recovered from another page, with **formatting**.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Control+Enter");
    await page.getByRole("button", { name: "Editing", exact: true }).click();
    await page.getByRole("link", { name: "projects", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.reload();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Recovered unsaved edits");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(await readFile("content/about.md", "utf8")).toContain("Recovered from another page, with **formatting**.");
    await page.goto("/about");
    await page.getByRole("button", { name: "Edit intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("An unsaved draft to preserve.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Escape");
    await expect(page.getByText("Recovered from another page, with formatting.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Edit intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("An unsaved draft to preserve.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Control+Enter");
    const external = (await readFile("content/about.md", "utf8")) + "\n";
    await writeFile("content/about.md", external, "utf8");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("alert")).toContainText(/changed|conflict/i);
    expect(await readFile("content/about.md", "utf8")).toBe(external);
    expect(await page.evaluate(() => localStorage.getItem("content-studio:v1:draft:about"))).toContain("An unsaved draft to preserve.");
  } finally { await page.waitForLoadState("networkidle").catch(() => {}); await writeFile("content/about.md", original, "utf8"); }
});

test("matches normal site geometry on the same pages and viewport", async ({ page, context }) => {
  test.skip(!process.env.STUDIO_REFERENCE_URL, "Provide a normal development site for parity checks");
  const reference = await context.newPage();
  await reference.addInitScript(() => { localStorage.setItem("nb-style", "margin"); localStorage.setItem("nb-rice", "ayu-mirage"); });
  const measure = () => Array.from(document.querySelectorAll(".rack, .instruments, main, main h1, main h2, main h3, main p, main ol, main ul, main li, main pre, main table, main blockquote"))
    .filter((element) => element.getBoundingClientRect().width > 0)
    .map((element) => { const r = element.getBoundingClientRect(); return { tag: element.tagName, text: element.matches(".rack, .instruments, main") ? "" : element.textContent, x: Math.round(r.x * 10), y: Math.round(r.y * 10), width: Math.round(r.width * 10), height: Math.round(r.height * 10) }; });
  try {
    for (const route of ["/", "/about", "/p/scrivo", "/p/tauri-explorer"]) {
      await page.goto(route);
      await reference.goto(`${process.env.STUDIO_REFERENCE_URL}${route}`);
      await page.evaluate(() => document.fonts.ready);
      await reference.evaluate(() => document.fonts.ready);
      await expect(reference.getByRole("button", { name: "Theme: ayu mirage. Choose theme", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Deploy", exact: true })).toBeEnabled();
      expect(await page.evaluate(measure), `Layout parity for ${route}`).toEqual(await reference.evaluate(measure));
    }
  } finally { await reference.close(); }
});
