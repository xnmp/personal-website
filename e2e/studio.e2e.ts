import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { parseContent } from "../src/lib/content";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run only against the opted-in local studio with one worker");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); localStorage.setItem("nb-rice", "ayu-mirage"); });
  page.on("dialog", (dialog) => dialog.accept());
});

test("renders authored Markdown after preview, save and reload on the actual site", async ({ page, context }) => {
  const files = ["about", "projects/scrivo"];
  const originals = new Map(await Promise.all(files.map(async id => [id, await readFile(`content/${id}.md`, "utf8")] as const)));
  const markdown = "## Field notes\n\nA **measured** result.\n\n- Keep the source\n- Publish the result";
  const headline = "A **working** garden";
  const summary = "### Latest notes\n\n- **Fast** opening\n- Plain files";
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const intro = page.getByRole("textbox", { name: "intro", exact: true });
    const originalFirst = await intro.inputValue();
    const sibling = await page.getByRole("textbox", { name: "intro · part 2", exact: true }).inputValue();
    await intro.fill(markdown);
    await expect(intro).toHaveValue(markdown);
    await expect(page.getByRole("textbox", { name: "intro · part 2", exact: true })).toHaveValue(sibling);
    await expect(page.locator("[contenteditable]")).toHaveCount(0);
    await page.getByRole("textbox", { name: "headline", exact: true }).fill(headline);
    await page.getByRole("button", { name: "Editing on", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Field notes", exact: true })).toBeVisible();
    await expect(page.locator("h1 strong")).toHaveText("working");
    await expect(page.locator(".detail-hero p strong")).toHaveText("measured");
    await expect(page.locator(".detail-hero ul > li")).toHaveText(["Keep the source", "Publish the result"]);
    expect(await page.locator(".detail-hero ul").evaluate(element => getComputedStyle(element).listStyleType)).toBe("disc");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    const saved = parseContent(await readFile("content/about.md", "utf8"));
    expect(saved.data.headline).toBe(headline);
    expect(saved.blocks.intro).toBe(parseContent(originals.get("about")!).blocks.intro.replace(originalFirst, markdown));
    await page.reload();
    await expect(page.locator("h1 strong")).toHaveText("working");
    await expect(page.getByRole("heading", { name: "Field notes", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "intro", exact: true })).toHaveValue("## Field notes");
    await expect(page.getByRole("textbox", { name: "intro · part 3", exact: true })).toHaveValue("- Keep the source\n- Publish the result");

    await page.goto("/projects");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const entry = page.locator(".margin-project").filter({ has: page.locator('h3 a[href="/p/scrivo"]') });
    await entry.getByRole("textbox", { name: "title", exact: true }).fill("**Scrivo** notes");
    await entry.getByRole("textbox", { name: "summary", exact: true }).fill(summary);
    await page.getByRole("button", { name: "Editing on", exact: true }).click();
    await expect(entry.locator("h3 a strong")).toHaveText("Scrivo");
    await expect(entry.getByRole("heading", { name: "Latest notes", exact: true })).toBeVisible();
    await expect(entry.locator("ul > li")).toHaveText(["Fast opening", "Plain files"]);
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(parseContent(await readFile("content/projects/scrivo.md", "utf8")).data.summary).toBe(summary);

    if (process.env.STUDIO_REFERENCE_URL) {
      const publicPage = await context.newPage();
      try {
        await publicPage.goto(`${process.env.STUDIO_REFERENCE_URL}/`);
        await expect(publicPage.locator("h1 strong")).toHaveText("working");
        await expect(publicPage.getByRole("heading", { name: "Field notes", exact: true })).toBeVisible();
        await expect(publicPage.locator(".detail-hero ul > li")).toHaveText(["Keep the source", "Publish the result"]);
        await expect(publicPage.locator("textarea, [contenteditable], .studio-dock")).toHaveCount(0);
        await publicPage.goto(`${process.env.STUDIO_REFERENCE_URL}/projects`);
        const publicEntry = publicPage.locator('.margin-entry').filter({ has: publicPage.locator('h3 a[href="/p/scrivo"]') });
        await expect(publicEntry.locator("h3 a strong")).toHaveText("Scrivo");
        await expect(publicEntry.getByRole("heading", { name: "Latest notes", exact: true })).toBeVisible();
        await expect(publicEntry.locator("ul > li")).toHaveText(["Fast opening", "Plain files"]);
      } finally { await publicPage.close(); }
    }
    expect(errors).toEqual([]);
  } finally {
    await page.waitForLoadState("networkidle").catch(() => {});
    for (const [id, source] of originals) await writeFile(`content/${id}.md`, source, "utf8");
  }
});

test("edits the actual pages, saves exact Markdown and deploys from the bottom-left", async ({ page }) => {
  const originals = new Map(await Promise.all(["home", "about", "projects/scrivo"].map(async (id) => [id, await readFile(`content/${id}.md`, "utf8")] as const)));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".about-page")).toBeVisible();
    await page.getByRole("link", { name: "projects", exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator(".margin-index")).toBeVisible();
    await expect(page.locator("iframe, .studio-shell, .studio-block")).toHaveCount(0);
    for (const scenario of [
      { route: "/projects", document: "home", field: "margin intro", value: "A private garden, edited in place.", visible: "A private garden, edited in place." },
      { route: "/about", document: "about", field: "intro", value: "A new introduction, edited in place.", visible: "A new introduction, edited in place." },
      { route: "/p/scrivo", document: "projects/scrivo", field: "headline", value: "A locally edited Scrivo headline.", visible: "A locally edited Scrivo headline." },
    ]) {
      await page.goto(scenario.route);
      await page.getByRole("button", { name: "Editing off", exact: true }).click();
      await page.getByRole("textbox", { name: scenario.field, exact: true }).click();
      const input = page.getByRole("textbox", { name: scenario.field, exact: true });
      await expect(input).toBeFocused();
      await input.fill(scenario.value);
      await input.press("Control+Enter");
      await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
      await expect(input).toBeFocused();
      expect(await readFile(`content/${scenario.document}.md`, "utf8")).toContain(scenario.value);
      await page.reload();
      await expect(page.getByText(scenario.visible, { exact: true })).toBeVisible();
    }
    await page.goto("/projects");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    // A linked title edits in place; Browsing restores the actual site's navigation.
    const title = page.locator('.margin-entry h3 [data-studio-document="projects/scrivo"] textarea');
    await expect(title).toHaveJSProperty("tagName", "TEXTAREA");
    await title.click();
    await title.fill("Scrivo, edited locally");
    await title.press("Enter");
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
    await page.getByRole("button", { name: "Editing on", exact: true }).click();
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
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const headline = page.getByRole("textbox", { name: "headline", exact: true });
    await headline.focus();
    await expect(headline).toBeFocused();
    await expect(page.getByRole("textbox", { name: "headline", exact: true })).toBeFocused();
    await page.getByRole("textbox", { name: "headline", exact: true }).press("Escape");
    await page.getByRole("textbox", { name: "intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("Recovered from another page, with my edits.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Tab");
    await page.getByRole("button", { name: "Editing on", exact: true }).click();
    await page.getByRole("link", { name: "projects", exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await page.reload();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Recovered unsaved edits");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(await readFile("content/about.md", "utf8")).toContain("Recovered from another page, with my edits.");
    await page.goto("/about");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("An unsaved draft to preserve.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Escape");
    await expect(page.getByText("Recovered from another page, with my edits.", { exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "intro", exact: true }).click();
    await page.getByRole("textbox", { name: "intro", exact: true }).fill("An unsaved draft to preserve.");
    await page.getByRole("textbox", { name: "intro", exact: true }).press("Tab");
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
    for (const route of ["/", "/projects", "/about", "/p/scrivo", "/p/tauri-explorer"]) {
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


test("native textarea pastes, deletes blank lines, undoes and saves exact source", async ({ page, context }) => {
  const original = await readFile("content/about.md", "utf8");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/about");
    await expect(page.locator("textarea, [contenteditable]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Editing off", exact: true })).toBeEnabled();
    await page.keyboard.press("Control+e");
    const intro = page.getByRole("textbox", { name: "intro", exact: true });
    const first = await intro.inputValue();
    const sibling = await page.getByRole("textbox", { name: "intro · part 2", exact: true }).inputValue();
    await expect(intro).toHaveJSProperty("tagName", "TEXTAREA");
    await expect(page.locator("[contenteditable]")).toHaveCount(0);
    const pasted = "First line\n\n\nLast line 🌱";
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(text => navigator.clipboard.writeText(text), pasted);
    await intro.focus();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Control+v");
    await expect(intro).toHaveValue(pasted);
    await page.keyboard.press("Control+Home");
    await page.keyboard.press("End");
    await page.keyboard.press("Delete");
    await page.keyboard.press("Delete");
    await expect(intro).toHaveValue("First line\nLast line 🌱");
    await page.keyboard.press("Control+z");
    expect(await intro.inputValue()).toContain("\n\n");
    await page.keyboard.press("Control+Shift+z");
    const final = "First line\nLast line 🌱";
    await expect(intro).toHaveValue(final);
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(await readFile("content/about.md", "utf8")).toBe(original.replace(first, final));
    await expect(page.getByRole("textbox", { name: "intro · part 2", exact: true })).toHaveValue(sibling);
    await page.reload();
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "intro", exact: true })).toHaveValue(final);
    expect(errors).toEqual([]);
  } finally {
    await page.waitForLoadState("networkidle").catch(() => {});
    await writeFile("content/about.md", original, "utf8");
  }
});

test("clearing a field keeps the next field stable and saves only those changes", async ({ page }) => {
  const original = await readFile("content/about.md", "utf8");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/about");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const first = page.getByRole("textbox", { name: "intro", exact: true });
    const second = page.getByRole("textbox", { name: "intro · part 2", exact: true });
    const originalFirst = await first.inputValue();
    const originalSecond = await second.inputValue();
    await first.focus();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
    await expect(first).toHaveValue("");
    await expect(first).toBeVisible();
    const secondBox = await second.boundingBox();
    await second.click();
    await expect(second).toBeFocused();
    expect(await second.boundingBox()).toEqual(secondBox);
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" Edited here.");
    await expect(second).toHaveValue(originalSecond + " Edited here.");
    await expect(page.getByRole("textbox", { name: "sections · 0 · kicker", exact: true })).toHaveValue("How I work");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    const clearedSource = original.replace(originalFirst + "\n\n", "").replace(originalSecond, originalSecond + " Edited here.");
    expect(await readFile("content/about.md", "utf8")).toBe(clearedSource);
    await second.focus();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" Again.");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(await readFile("content/about.md", "utf8")).toBe(clearedSource.replace(" Edited here.", " Edited here. Again."));
    await first.click();
    await page.keyboard.type("Retyped first paragraph.");
    await expect(first).toHaveValue("Retyped first paragraph.");
    await page.getByRole("button", { name: "Save locally", exact: true }).click();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    expect(await readFile("content/about.md", "utf8")).toBe(original.replace(originalFirst, "Retyped first paragraph.").replace(originalSecond, originalSecond + " Edited here. Again."));
    expect(errors).toEqual([]);
  } finally {
    await page.waitForLoadState("networkidle").catch(() => {});
    await writeFile("content/about.md", original, "utf8");
  }
});

test("native drag selection works in both directions and clicking collapses it", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const input = page.getByRole("textbox", { name: "intro", exact: true });
  await input.fill("First line\n\nLast line.");
  await input.scrollIntoViewIfNeeded();
  const { a, b } = await input.evaluate((element: HTMLTextAreaElement) => {
    const box = element.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(element).lineHeight);
    return { a: { x: box.x + 1, y: box.y + line / 2 }, b: { x: box.x + box.width / 2, y: box.y + line * 2.5 } };
  });
  const selected = () => input.evaluate((element: HTMLTextAreaElement) => element.value.slice(element.selectionStart, element.selectionEnd));
  for (const [start, end] of [[a, b], [b, a]]) {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 15 }); await page.mouse.up();
    expect(await selected()).toBe("First line\n\nLast line.");
    await page.mouse.click(b.x, b.y);
    expect(await selected()).toBe("");
    await expect(input).toBeFocused();
  }
  await page.keyboard.press("Escape");
});

test("native controls keep typography, backgrounds and toggle behavior", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("button", { name: "Editing off", exact: true })).toBeEnabled();
  await page.keyboard.press("Control+e");
  const input = page.getByRole("textbox", { name: "intro", exact: true });
  await input.scrollIntoViewIfNeeded();
  const styles = await input.evaluate(element => {
    const style = getComputedStyle(element), parent = getComputedStyle(element.parentElement!);
    return { font: style.font, parentFont: parent.font, color: style.color, parentColor: parent.color, background: style.backgroundColor };
  });
  expect(styles.font).toBe(styles.parentFont);
  expect(styles.color).toBe(styles.parentColor);
  expect(styles.background).toBe("rgba(0, 0, 0, 0)");
  await input.fill("A retained draft.");
  await page.keyboard.press("Control+e");
  await expect(page.locator("textarea, [contenteditable]")).toHaveCount(0);
  await expect(page.getByText("A retained draft.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "intro", exact: true })).toHaveValue("A retained draft.");
});

test("discard ends editing and cannot resurrect rejected drafts", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const input = page.getByRole("textbox", { name: "intro", exact: true });
  const original = await input.inputValue();
  await input.fill("Unwanted draft");
  await page.route("**/api/studio", async route => {
    if (route.request().method() === "POST") await route.fulfill({ status: 409, json: { error: "Test conflict" } });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page.locator(".studio-dock").getByRole("alert")).toContainText("Test conflict");
  await page.getByRole("button", { name: "Discard unsaved edits", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editing off", exact: true })).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "intro", exact: true })).toHaveValue(original);
  await page.getByRole("textbox", { name: "intro", exact: true }).focus();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" X");
  await expect(page.getByRole("textbox", { name: "intro", exact: true })).toHaveValue(original + " X");
  expect(await page.evaluate(() => localStorage.getItem("content-studio:v1:draft:about"))).not.toContain("Unwanted draft");
});
