import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test.use({ channel: "chrome" });
test.skip(
  !process.env.STUDIO_E2E,
  "Run only against the opted-in local studio with one worker",
);

test("editing updates saved Markdown and real pages; deploy uses saved content", async ({
  page,
}) => {
  const originals = new Map(
    await Promise.all(
      ["home", "about", "projects/scrivo"].map(
        async (id) => [id, await readFile(`content/${id}.md`, "utf8")] as const,
      ),
    ),
  );
  try {
    await page.goto("/studio");
    await expect(
      page.getByRole("button", { name: "Edit margin intro", exact: true }),
    ).toBeVisible();
    for (const scenario of [
      {
        nav: "Projects",
        field: "margin intro",
        value: "A private garden, edited in the local sidecar.",
      },
      {
        nav: "About",
        field: "intro",
        value: "This introduction was edited in the local sidecar.",
      },
      {
        nav: "Scrivo",
        field: "headline",
        value: "A locally edited Scrivo headline.",
      },
    ]) {
      await page
        .getByRole("navigation", { name: "Content documents" })
        .getByRole("button", { name: scenario.nav, exact: true })
        .click();
      await page
        .getByRole("button", { name: `Edit ${scenario.field}`, exact: true })
        .click();
      await page
        .getByRole("textbox", { name: scenario.field, exact: true })
        .fill(scenario.value);
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page
        .getByRole("button", { name: "Save locally", exact: true })
        .click();
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: "Saved to your Markdown files" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Site preview", exact: true })
        .click();
      await expect(
        page.frameLocator("iframe").getByText(scenario.value, { exact: true }),
      ).toBeVisible({ timeout: 60_000 });
      await page
        .getByRole("button", { name: "Edit blocks", exact: true })
        .click();
    }
    // Metadata uses the same live catalogue as the actual site's project headings.
    await page.locator(".studio-fields > summary").click();
    await page.getByRole("button", { name: "Edit title", exact: true }).click();
    await page
      .getByRole("textbox", { name: "title", exact: true })
      .fill("Scrivo, edited locally");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("button", { name: "Save locally", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Site preview", exact: true })
      .click();
    await expect(
      page
        .frameLocator("iframe")
        .locator(".kicker")
        .getByText("Scrivo, edited locally", { exact: false }),
    ).toBeVisible({ timeout: 60_000 });
    await page
      .getByRole("button", { name: "Edit blocks", exact: true })
      .click();
    let deployRequests = 0;
    await page.route("**/api/studio", async (route) => {
      if (
        route.request().method() === "POST" &&
        route.request().postDataJSON().action === "deploy"
      ) {
        deployRequests++;
        await route.fulfill({
          json: {
            job: {
              phase: "live",
              message: "Mock publication accepted",
              url: "https://example.invalid",
            },
          },
        });
      } else await route.continue();
    });
    await page.getByRole("button", { name: "Deploy", exact: false }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Mock publication accepted" }),
    ).toBeVisible();
    expect(deployRequests).toBe(1);
    expect(await readFile("content/home.md", "utf8")).toContain(
      "A private garden, edited in the local sidecar.",
    );
    const deployBounds = await page.locator(".studio-deploy").boundingBox();
    const viewport = page.viewportSize()!;
    expect(deployBounds!.x).toBeLessThan(70);
    expect(deployBounds!.y + deployBounds!.height).toBeGreaterThan(
      viewport.height - 60,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    for (const [id, source] of originals)
      await writeFile(`content/${id}.md`, source, "utf8");
  }
});

test("recovers another page's unsaved draft and focuses boolean controls", async ({
  page,
}) => {
  const original = await readFile("content/about.md", "utf8");
  page.on("dialog", (dialog) => dialog.accept());
  try {
    await page.goto("/studio");
    await page
      .getByRole("navigation", { name: "Content documents" })
      .getByRole("button", { name: "About", exact: true })
      .click();
    const editButton = page.getByRole("button", {
      name: "Edit intro",
      exact: true,
    });
    await expect(editButton).toBeVisible();
    const bounds = await editButton.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await editButton.click();
    await page
      .getByRole("textbox", { name: "intro", exact: true })
      .fill("Recovered draft from another page.");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Content documents" })
      .getByRole("button", { name: "Projects", exact: true })
      .click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Save locally", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Save locally", exact: true })
      .click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Saved to your Markdown files" }),
    ).toBeVisible();
    expect(await readFile("content/about.md", "utf8")).toContain(
      "Recovered draft from another page.",
    );
    await page
      .getByRole("navigation", { name: "Content documents" })
      .getByRole("button", { name: "About", exact: true })
      .click();
    await page.locator(".studio-fields > summary").click();
    await page
      .getByRole("button", { name: "Edit sections · 2 · draft", exact: true })
      .click();
    await expect(
      page.getByLabel("sections · 2 · draft", { exact: true }),
    ).toBeFocused();
  } finally {
    await writeFile("content/about.md", original, "utf8");
  }
});
