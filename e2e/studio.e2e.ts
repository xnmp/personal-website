import { test, expect } from "@playwright/test";
import { interceptSaves, openField } from "./studio-fixture";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run against the opted-in local studio with one worker");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); localStorage.setItem("nb-rice", "ayu-mirage"); });
  page.on("dialog", dialog => dialog.accept());
});

test("edits actual pages and deploys saved content from the bottom-left", async ({ page }) => {
  const saved = await interceptSaves(page);
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".about-page")).toBeVisible();
  await expect(page.locator("iframe, .studio-shell, .studio-block")).toHaveCount(0);
  for (const scenario of [
    { route: "/projects", document: "home", field: "margin intro", value: "A private garden, edited in place." },
    { route: "/about", document: "about", field: "intro", value: "A new introduction, edited in place." },
    { route: "/p/scrivo", document: "projects/scrivo", field: "headline", value: "A locally edited Scrivo headline." },
  ]) {
    await page.goto(scenario.route);
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const input = await openField(page, scenario.field);
    await input.fill(scenario.value); await input.press("Control+Enter");
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    await expect(input).toHaveCount(0);
    expect(saved.sources.get(scenario.document)).toContain(scenario.value);
    await expect(page.getByText(scenario.value, { exact: true })).toBeVisible();
  }
  await page.goto("/projects");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const entry = page.locator('.margin-entry').filter({ has: page.locator('[data-studio-document="projects/scrivo"]') });
  const title = await openField(entry, "title");
  await title.fill("Scrivo, edited locally"); await title.press("Enter");
  let deployRequests = 0;
  await page.route("**/api/studio", async route => {
    if (route.request().method() === "POST" && route.request().postDataJSON().action === "deploy") {
      deployRequests++;
      expect(saved.sources.get("projects/scrivo")).toContain("Scrivo, edited locally");
      await route.fulfill({ json: { job: { phase: "live", message: "Mock publication accepted", url: "https://example.invalid" } } });
    } else await route.fallback();
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
});

test("drafts recover across pages, survive failed saves, and can be discarded", async ({ page }) => {
  const saved = await interceptSaves(page);
  await page.goto("/about");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const input = await openField(page, "intro");
  await input.fill("Recovered from another page, with my edits."); await input.press("Tab");
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await page.reload();
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Recovered unsaved edits");
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
  expect(saved.sources.get("about")).toContain("Recovered from another page, with my edits.");
  await page.goto("/");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await (await openField(page, "intro")).fill("An unsaved draft to preserve.");
  await page.route("**/api/studio", route => route.request().method() === "POST"
    ? route.fulfill({ status: 409, json: { error: "The Markdown file changed on disk" } }) : route.fallback());
  await page.getByRole("textbox", { name: "intro", exact: true }).press("Control+Enter");
  await expect(page.locator(".studio-dock").getByRole("alert")).toContainText("The Markdown file changed on disk");
  expect(await page.evaluate(() => localStorage.getItem("content-studio:v1:draft:about"))).toContain("An unsaved draft to preserve.");
  await page.getByRole("button", { name: "Discard unsaved edits", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editing off", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const reopened = await openField(page, "intro");
  expect(await reopened.inputValue()).not.toBe("An unsaved draft to preserve.");
  await reopened.press("Control+End"); await reopened.pressSequentially(" X");
  expect(await page.evaluate(() => localStorage.getItem("content-studio:v1:draft:about"))).not.toContain("An unsaved draft to preserve.");
});

test("native editing preserves paste, blank lines, undo and bidirectional drag selection", async ({ page, context }) => {
  await interceptSaves(page);
  await page.goto("/about");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const input = await openField(page, "intro");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("First line\n\n\nLast line."));
  await input.press("Control+a"); await input.press("Control+v");
  await expect(input).toHaveValue("First line\n\n\nLast line.");
  await input.press("Control+Home"); await input.press("End"); await input.press("Delete");
  await expect(input).toHaveValue("First line\n\nLast line.");
  await input.press("Control+z");
  await expect(input).toHaveValue("First line\n\n\nLast line.");
  await input.press("Control+Shift+z");
  await expect(input).toHaveValue("First line\n\nLast line.");
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
  await input.press("Escape");
});


test("whole sections render Markdown except while being edited, including after draft recovery and save", async ({ page }) => {
  const saved = await interceptSaves(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await page.locator('[data-studio-slot="block:intro"]').click({ position: { x: 12, y: 12 } });
  const intro = page.getByRole("textbox", { name: "intro", exact: true });
  const source = "## Notes\n\nA **bold** result.\n\n" + Array.from({ length: 10 }, (_, i) => `Paragraph ${i + 1}.`).join("\n\n") + "\n\n- One\n- Two";
  await intro.fill(source);
  await page.locator('[data-studio-slot="block:section-1"]').click({ position: { x: 12, y: 12 } });
  const neighbour = page.getByRole("textbox", { name: "section 1", exact: true });
  await expect(neighbour).toBeFocused();
  await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
  await expect(page.locator(".detail-hero strong")).toHaveText("bold");
  await expect(page.locator(".detail-hero li")).toHaveText(["One", "Two"]);
  const neighbourSource = await neighbour.inputValue();
  await neighbour.fill("Discard this draft"); await neighbour.press("Escape");
  await expect(await openField(page, "section 1")).toHaveValue(neighbourSource);
  await page.reload();
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const recovered = await openField(page, "intro");
  await expect(recovered).toHaveValue(source);
  await recovered.press("Control+Enter");
  await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editing on", exact: true })).toBeVisible();
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
  expect(saved.sources.get("about")).toContain(source);
  const editButton = page.getByRole("button", { name: "Edit intro", exact: true });
  await editButton.focus(); await editButton.press("Enter");
  const reopened = page.getByRole("textbox", { name: "intro", exact: true });
  await expect(reopened).toHaveValue(source);
  await reopened.fill(""); await reopened.press("Tab");
  await expect(await openField(page, "intro")).toHaveValue("");
  await expect(await openField(page, "section 1")).toHaveValue(neighbourSource);
});

test("done saves once without waiting for the network, and unchanged fields finish without saving", async ({ page }) => {
  const saved = await interceptSaves(page, true);
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Editing off", exact: true }).click();
    const input = await openField(page, "intro");
    for (const marker of ["-", "*"]) {
      await input.fill(`${marker} First`); await input.press("End"); await input.press("Enter");
      await expect(input).toHaveValue(`${marker} First\n${marker} `);
      await input.press("Enter"); await input.pressSequentially("A paragraph");
      await expect(input).toHaveValue(`${marker} First\n\nA paragraph`);
    }
    await input.press("Meta+Enter");
    await expect(page.locator(".detail-hero li")).toHaveText("First");
    await expect(page.locator(".detail-hero p").filter({ hasText: /^A paragraph$/ })).toBeVisible();
    await expect.poll(() => saved.requests.length).toBe(1);
    await page.keyboard.press("Meta+Enter");
    expect(saved.requests).toHaveLength(1);
    saved.release();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    const next = await openField(page, "section 1");
    await next.dispatchEvent("keydown", { key: "Enter", ctrlKey: true, repeat: true });
    await expect(next).toBeFocused();
    await next.press("Control+Enter");
    await expect(page.getByRole("button", { name: "Edit section 1", exact: true })).toBeEnabled();
    expect(saved.requests).toHaveLength(1);
  } finally { saved.release(); }
});
