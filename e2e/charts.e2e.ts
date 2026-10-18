import { test, expect } from "@playwright/test";

test.use({ channel: "chrome", launchOptions: { args: ["--disable-dev-shm-usage"] } });

test("opens the project before loading offscreen charts, then renders each chart on scroll", async ({ page }) => {
  const errors: string[] = [];
  const chartPayloads: Promise<number>[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (/echarts|zrender/.test(response.url())) chartPayloads.push(response.body().then(body => body.length)); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => { localStorage.setItem("nb-style", "margin"); localStorage.setItem("nb-rice", "paper"); });
  await page.goto("/p/eskiv");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("that plays a dodger");
  // Next may fetch its tiny async-module stub; the chart engine stays deferred.
  expect((await Promise.all(chartPayloads)).reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(4096);
  for (const name of ["Path ratio vs number of balls", "Player position density by score", "Final score distribution across 10,000 games"]) {
    const chart = page.getByRole("img", { name, exact: true });
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toHaveAttribute("aria-busy", "false");
    await expect(chart.locator("svg")).toBeVisible();
    expect(await chart.locator("svg path").count()).toBeGreaterThan(10);
  }
  // A remounted project must initialize charts again after navigating away.
  await page.getByRole("link", { name: "projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.locator('h3 a[href="/p/eskiv"]').click();
  const chart = page.getByRole("img", { name: "Path ratio vs number of balls", exact: true });
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator("svg")).toBeVisible();
  expect(errors).toEqual([]);
});
