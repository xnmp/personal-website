import { expect, test } from "@playwright/test";
import { interceptSaves } from "./studio-fixture";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=2"] } });
test.skip(!process.env.STUDIO_E2E, "Run against the opted-in local studio");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); });
  await page.goto("/");
  await page.getByRole("button", { name: "Editing off", exact: true }).click();
});

for (const marker of ["-", "*"]) {
  test(`${marker} continues on Enter and an empty item exits the list`, async ({ page }) => {
    await interceptSaves(page);
    const input = page.getByRole("textbox", { name: "intro", exact: true });
    await input.fill(`${marker} First`);
    await input.press("End");
    await input.press("Enter");
    await expect(input).toHaveValue(`${marker} First\n${marker} `);
    await expect(input).toBeFocused();
    await input.pressSequentially("Second");
    await input.press("Enter");
    await expect(input).toHaveValue(`${marker} First\n${marker} Second\n${marker} `);
    await input.press("Enter");
    await expect(input).toHaveValue(`${marker} First\n${marker} Second\n\n`);
    await input.pressSequentially("A paragraph");
    await expect(input).toHaveValue(`${marker} First\n${marker} Second\n\nA paragraph`);
    await page.keyboard.press("Control+e");
    await expect(page.locator(".detail-hero ul > li")).toHaveText(["First", "Second"]);
    await expect(page.locator(".detail-hero").getByRole("paragraph").filter({ hasText: /^A paragraph$/ })).toBeVisible();
  });
}

test("list continuation and exit support native undo, redo and the Save shortcut", async ({ page }) => {
  const saved = await interceptSaves(page);
  const input = page.getByRole("textbox", { name: "intro", exact: true });
  await input.fill("- First");
  await input.press("End");
  await input.press("Enter");
  await expect(input).toHaveValue("- First\n- ");
  await input.press("Control+z");
  await expect(input).toHaveValue("- First");
  await input.press("Control+Shift+z");
  await expect(input).toHaveValue("- First\n- ");
  await input.press("Enter");
  await expect(input).toHaveValue("- First\n\n");
  await input.press("Control+z");
  await expect(input).toHaveValue("- First\n- ");
  await input.press("Control+Shift+z");
  await expect(input).toHaveValue("- First\n\n");
  await input.pressSequentially("After the list");
  await input.press("Control+Enter");
  await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
  await expect(input).toHaveValue("- First\n\nAfter the list");
  await expect(input).not.toBeFocused();
  expect(saved.sources.get("about")).toContain("- First\n\nAfter the list");
  expect(saved.requests).toEqual([expect.objectContaining({ action: "save", id: "about" })]);
});

test("selected text, Shift+Enter and composition retain native behavior", async ({ page }) => {
  await interceptSaves(page);
  const input = page.getByRole("textbox", { name: "intro", exact: true });
  await input.fill("- First");
  await input.press("End");
  await input.press("Shift+Enter");
  await expect(input).toHaveValue("- First\n");
  await input.fill("- First");
  await input.press("End");
  await input.press("Control+Shift+ArrowLeft");
  await input.press("Enter");
  await expect(input).toHaveValue("- \n");
  await input.fill("- First");
  await input.press("End");
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(input).toHaveValue("- First");
  await input.press("Enter");
  await expect(input).toHaveValue("- First\n- ");
});

test("Enter cannot change a list while Save has locked the textarea", async ({ page }) => {
  const saved = await interceptSaves(page, true);
  try {
    const input = page.getByRole("textbox", { name: "intro", exact: true });
    await input.fill("* First");
    await input.press("End");
    await input.press("Control+Enter");
    await expect(input).not.toBeFocused();
    await expect(input).toHaveAttribute("readonly", "");
    await input.press("Enter");
    await expect(input).toHaveValue("* First");
    saved.release();
    await expect(page.locator(".studio-dock").getByRole("status")).toContainText("Saved to your Markdown files");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("* First");
  } finally { saved.release(); }
});
