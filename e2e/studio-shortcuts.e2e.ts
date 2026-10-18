import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { documentSlots, editDocument, previewRoute } from "../src/lib/studio/document";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run against the opted-in local studio");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); });
});

/** Keep this shortcut suite safe for an editor containing the owner's unsaved work. */
async function interceptSaves(page: Page, holdFirst = false) {
  const sources = new Map<string, string>();
  const requests: { action: string; id?: string }[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/studio", async route => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postDataJSON();
    requests.push(body);
    if (body.action !== "save") return route.fulfill({ status: 400, json: { error: "Only local saves are allowed in this test" } });
    const original = sources.get(body.id) ?? await readFile(`content/${body.id}.md`, "utf8");
    const source = editDocument(original, body.edits);
    sources.set(body.id, source);
    if (holdFirst && requests.length === 1) await gate;
    return route.fulfill({ json: { document: {
      id: body.id, title: body.id, route: previewRoute(body.id), source,
      revision: createHash("sha256").update(source).digest("hex"), slots: documentSlots(source),
    } } });
  });
  return { sources, requests, release };
}

for (const chord of ["Control+Enter", "Meta+Enter"]) {
  test(`${chord} saves body text once, preserves newlines and keeps focus`, async ({ page }) => {
    const saved = await interceptSaves(page, true);
    try {
      await page.goto("/");
      await page.getByRole("button", { name: "Editing off", exact: true }).click();
      const input = page.getByRole("textbox", { name: "intro", exact: true });
      await input.fill("First line");
      await input.press("End");
      await input.press("Enter");
      await input.pressSequentially("Second line");
      await expect(input).toHaveValue("First line\nSecond line");
      await input.press(chord);
      await expect.poll(() => saved.requests.length).toBe(1);
      await expect(input).toHaveAttribute("readonly", "");
      await input.press(chord);
      await input.dispatchEvent("keydown", { key: "Enter", ctrlKey: true, repeat: true });
      expect(saved.requests).toEqual([expect.objectContaining({ action: "save", id: "about" })]);
      saved.release();
      await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("First line\nSecond line");
      expect(saved.sources.get("about")).toContain("First line\nSecond line");
      await expect(page.getByRole("button", { name: "Save locally", exact: true })).toBeDisabled();
      await input.press(chord);
      expect(saved.requests).toHaveLength(1);
    } finally { saved.release(); }
  });
}

test("the save shortcut works in inline titles and saves pending edits from other pages", async ({ page }) => {
  const saved = await interceptSaves(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await page.getByRole("textbox", { name: "headline", exact: true }).fill("An unsaved About headline");
  await page.getByRole("button", { name: "Editing on", exact: true }).click();
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const title = page.locator('.margin-entry h3 [data-studio-document="projects/scrivo"] textarea');
  await title.fill("A saved project title");
  await title.press("Control+Enter");
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
  await expect(title).toBeFocused();
  await expect(title).toHaveValue("A saved project title");
  expect(saved.sources.get("about")).toContain("An unsaved About headline");
  expect(saved.sources.get("projects/scrivo")).toContain("A saved project title");
  expect(saved.requests.map(request => [request.action, request.id])).toEqual([["save", "about"], ["save", "projects/scrivo"]]);
});
