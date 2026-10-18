import { expect, test } from "@playwright/test";
import { interceptSaves } from "./studio-fixture";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run against the opted-in local studio");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); });
});

test("a whole section stays one textbox through Markdown previews, draft reload and save", async ({ page }) => {
  const saved = await interceptSaves(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  const section = page.getByRole("textbox", { name: "intro", exact: true });
  const controls = page.locator('[data-studio-slot="block:intro"] textarea');
  const neighbour = page.getByRole("textbox", { name: "section 1", exact: true });
  const neighbourSource = await neighbour.inputValue();
  const source = "My current interests include\n\nA second paragraph.\n\n## Notes\n\n- One\n- **Two**";
  await section.fill(source);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Control+e");
    await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
    await expect(page.locator(".detail-hero ul > li")).toHaveText(["One", "Two"]);
    await page.keyboard.press("Control+e");
    await expect(controls).toHaveCount(1);
    await expect(section).toHaveValue(source);
    await expect(neighbour).toHaveValue(neighbourSource);
  }
  await page.reload();
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
  await expect(controls).toHaveCount(1);
  await expect(section).toHaveValue(source);
  await section.press("Control+Enter");
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
  expect(saved.sources.get("about")).toContain(source);
  await page.keyboard.press("Control+e");
  await page.keyboard.press("Control+e");
  await expect(controls).toHaveCount(1);
  await expect(section).toHaveValue(source);
  await section.fill("");
  await page.keyboard.press("Control+e");
  await page.keyboard.press("Control+e");
  await expect(controls).toHaveCount(1);
  await expect(section).toBeVisible();
  await expect(section).toHaveValue("");
  await expect(neighbour).toHaveValue(neighbourSource);
  await expect(page.locator("[contenteditable]")).toHaveCount(0);
});
