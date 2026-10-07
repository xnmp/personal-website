import { expect, test } from "@playwright/test";

test.describe("Tauri Explorer launch page", () => {
  test("Ctrl+P on the page powers on the live demo instead of printing", async ({ page, isMobile }) => {
    test.skip(isMobile, "no physical keyboard");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await expect(page.locator("iframe.live-frame")).toHaveCount(0);
    await page.keyboard.press("Control+p");
    const frame = page.locator("iframe.live-frame");
    await expect(frame).toHaveAttribute("src", "https://tauri-explorer.vercel.app/?theme=dark");
    await expect(frame).toBeInViewport();
    // once loaded, the app has the keyboard, so the next Ctrl+P is the app's own,
    // and the page says so (and how to take it back)
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName), { timeout: 20_000 }).toBe("IFRAME");
    const live = page.locator("#live");
    await expect(live).toContainText("The app has the keyboard");
    await page.locator(".launch-hero h1").click();
    await expect(live).not.toContainText("The app has the keyboard");
    await expect(live).toContainText("web build, with a demo folder");
  });

  test("tabbing to the power key keeps it: the demo doesn't boot out from under it", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch opens the app full screen instead");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    const power = page.getByRole("button", { name: "Power on the live demo" });
    await power.focus(); // scrolls the screen into view, as Tab does
    await page.waitForTimeout(800);
    await expect(power).toBeFocused();
    await expect(page.locator("iframe.live-frame")).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(page.locator(".live-demo")).not.toHaveAttribute("data-state", "off");
  });

  test("on touch, the key opens the app full screen in a new tab and nothing boots in the page", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch only");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await page.locator("#live").scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Power on the live demo" })).toBeHidden();
    const open = page.getByRole("link", { name: "Open the live demo ↗" });
    await expect(open).toHaveAttribute("href", "https://tauri-explorer.vercel.app/?theme=dark");
    await expect(open).toHaveAttribute("target", "_blank");
    await expect(page.locator("iframe.live-frame")).toHaveCount(0);
  });

  test("the power key starts the demo", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch opens the app full screen instead");
    // too short a window for half the screen to be in view, so it never boots on its own
    await page.setViewportSize({ width: 1280, height: 300 });
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await page.getByRole("button", { name: "Power on the live demo" }).click();
    await expect(page.locator("iframe.live-frame")).toBeVisible();
  });

  test("a demo that booted on scroll stays out of the Tab order until it's asked to take the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard only");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await page.locator("#live").scrollIntoViewIfNeeded();
    await expect(page.locator(".live-demo")).toHaveAttribute("data-state", "live", { timeout: 20_000 });
    // Tab from the control just before the screen goes past it, not into the app
    await page.locator("#live").evaluate((live) => {
      const before = [...document.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
        (e) => !live.contains(e) && live.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING
      );
      before.at(-1)!.focus();
    });
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("IFRAME");
    // and the keyboard goes in on request
    await page.getByRole("button", { name: "Give it the keyboard" }).click();
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");
    await expect(page.locator("#live")).toContainText("Tab past the app’s last control");
  });

  test("on desktop the demo boots once it scrolls into view", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch opens the app full screen instead");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await expect(page.locator("iframe.live-frame")).toHaveCount(0);
    await page.locator("#live").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(page.locator("iframe.live-frame")).toBeVisible();
  });

  test("the demo that boots on scroll is usable (names not collapsed) and leaves the keyboard with the page", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch opens the app full screen instead");
    await page.goto("/p/tauri-explorer");
    await page.locator("#live").evaluate((el) => el.scrollIntoView({ block: "center" }));
    const readme = page.frameLocator("iframe.live-frame").getByText("README.md", { exact: true }).first();
    await expect(readme).toBeVisible({ timeout: 20_000 });
    // the web build collapses its name column below ~1400px; the page renders it at 1440 and scales
    const box = await readme.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(40);
    // it booted because it scrolled into view, so the keyboard stays with the page
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  });

  test("held keys press their keycaps", async ({ page, isMobile }) => {
    test.skip(isMobile, "no physical keyboard");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    const ctrlCap = page.locator(".launch-shot-cap .key.cap").first();
    await expect(ctrlCap).not.toHaveAttribute("data-down", "true");
    await page.keyboard.down("Control");
    await expect(ctrlCap).toHaveAttribute("data-down", "true");
    await page.keyboard.up("Control");
    await expect(ctrlCap).not.toHaveAttribute("data-down", "true");
  });

  test("the hero's alpha key is the prefilled invite, said so beside it, and the terms are one link away", async ({ page, isMobile }) => {
    await page.goto("/p/tauri-explorer");
    const hero = page.locator(".launch-hero");
    const join = hero.getByRole("link", { name: "Join the alpha" });
    await expect(join).toHaveAttribute("href", /^mailto:.+subject=Tauri%20Explorer%20alpha/);
    // the line saying it opens an email sits right under the key, phones included
    const note = hero.getByText(/^Opens an email to/);
    const [k, n] = [await join.boundingBox(), await note.boundingBox()];
    expect(n!.y - (k!.y + k!.height)).toBeLessThan(40);
    if (isMobile) {
      // phones keep the note to one row; the terms are further down the page
      await page.locator("#alpha").scrollIntoViewIfNeeded();
    } else {
      await hero.getByRole("link", { name: /What testers get/ }).click();
    }
    await expect(page.locator("#alpha")).toBeInViewport();
    await expect(page.locator("#alpha").getByRole("link", { name: "Join the alpha" })).toHaveAttribute("href", /^mailto:.+subject=Tauri%20Explorer%20alpha/);
    // webmail users without a mail app can copy the address instead, here and in the hero
    await expect(page.locator("#alpha").getByRole("button", { name: /^Copy: .+@.+/ })).toBeVisible();
    await expect(hero.getByRole("button", { name: /^Copy: .+@.+/ })).toBeAttached();
  });

  test("the licence, privacy stance and project counts sit with the hero's call to action", async ({ page }) => {
    await page.goto("/p/tauri-explorer");
    const proof = page.locator(".launch-hero").getByRole("list", { name: "At a glance" });
    await expect(proof).toBeVisible();
    await expect(proof).toContainText("MIT licensed");
    await expect(proof).toContainText("No telemetry");
    await expect(proof).toContainText(/\d[\d,]* commits/);
    await expect(proof).toContainText(/unit tests/);
  });

  test("on a desktop, the download key is the build for that OS, with every build one key away", async ({ page, isMobile }) => {
    test.skip(isMobile, "phones get the release page");
    // the Desktop Chrome device reports Windows
    await page.goto("/p/tauri-explorer");
    const builds = page.getByRole("link", { name: /^Download for Windows/ });
    await expect(builds).not.toHaveCount(0);
    for (const link of await builds.all())
      await expect(link).toHaveAttribute("href", /\/releases\/download\/v[\d.]+\/tauri-explorer_[\d.]+_x64-setup\.exe$/);
    await expect(page.locator("#install").getByRole("link", { name: "Other builds" })).toHaveAttribute(
      "href",
      "https://github.com/xnmp/tauri-explorer/releases/latest"
    );
    // its legend stays on one line at desktop widths (a wrapped cap is twice as tall)
    for (const width of [1920, 1440, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const link of await builds.all()) expect((await link.boundingBox())!.height, `${width}px`).toBeLessThan(64);
    }
  });

  test("the skip link is the first Tab stop and is legible when it appears", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard only");
    await page.goto("/p/tauri-explorer");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    const [fg, bg] = await skip.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor]);
    expect(fg).not.toBe(bg);
    await page.keyboard.press("Enter");
    await expect(page.locator("main#content")).toBeFocused();
  });

  test("where no build would install, the download key opens the release page", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    await expect(page.getByRole("link", { name: /^Download for/ })).toHaveCount(0);
    const downloads = page.getByRole("link", { name: /^All desktop builds/ });
    await expect(downloads).not.toHaveCount(0);
    for (const link of await downloads.all())
      await expect(link).toHaveAttribute("href", "https://github.com/xnmp/tauri-explorer/releases/latest");
  });

  test("a screenshot opens its full window on the page, and Esc puts you back where you were", async ({ page }) => {
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    const shot = page.getByRole("link", { name: "Content search: full window" });
    await shot.click();
    const box = page.getByRole("dialog", { name: "Content search, full window" });
    await expect(box).toBeVisible();
    await expect(box.locator("img")).toHaveAttribute("src", "/tauri/live-content-search.webp");
    expect(page.url()).toMatch(/\/p\/tauri-explorer$/);
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
    await expect(shot).toBeFocused();
  });

  test("the page's own shortcuts stand down while the screenshot viewer is open", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard only");
    await page.goto("/p/tauri-explorer");
    await expect(page.locator(".rice-name")).not.toHaveText(/^(rice)?$/);
    const rice = await page.evaluate(() => document.documentElement.dataset.rice);
    await page.getByRole("link", { name: "Content search: full window" }).click();
    const box = page.getByRole("dialog", { name: "Content search, full window" });
    await expect(box).toBeVisible();
    for (const key of ["t", "/", "Control+k", "Control+p"]) {
      await page.keyboard.press(key);
      await expect(page.locator("dialog[open]"), key).toHaveCount(1);
    }
    expect(await page.evaluate(() => document.documentElement.dataset.rice)).toBe(rice);
    await expect(page.locator("#live iframe")).toHaveCount(0); // Ctrl+P didn't power the demo
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
    await page.keyboard.press("/");
    await expect(page.getByRole("dialog", { name: "Index of projects" })).toBeVisible(); // back in charge
  });

  test("on a phone, both calls to action, the key facts and the product are on the first screen", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    await page.goto("/p/tauri-explorer");
    const hero = page.locator(".launch-hero");
    const vh = page.viewportSize()!.height;
    const boxes = {
      join: await hero.getByRole("link", { name: "Join the alpha" }).boundingBox(),
      live: await hero.getByRole("link", { name: "Try it live" }).boundingBox(),
      facts: await hero.getByRole("list", { name: "At a glance" }).boundingBox(),
      product: await hero.getByRole("img", { name: /quick open/ }).boundingBox(),
    };
    for (const [name, box] of Object.entries(boxes)) expect(box!.y + box!.height, name).toBeLessThan(vh);
    expect(boxes.product!.height).toBeGreaterThan(80);
  });


  test.describe("on a Mac", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    });

    test("the download keys stay inside their column and off the text, at every desktop width", async ({ page, isMobile }) => {
      test.skip(isMobile, "desktop OS only");
      for (const width of [1920, 1440, 1200, 1024, 900]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/p/tauri-explorer");
        await expect(page.locator("#alpha").getByRole("link", { name: /Download for Mac/ })).toBeVisible();
        const clashes = await page.evaluate(() => {
          const keys = [...document.querySelectorAll("#alpha .key, #install .key")];
          const texts = [...document.querySelectorAll("#alpha p, #alpha li, #alpha h3, #install p, #install h3, #install pre")];
          const out: string[] = [];
          for (const k of keys) {
            const a = k.getBoundingClientRect();
            const col = k.parentElement!.getBoundingClientRect();
            if (a.right > col.right + 1) out.push(`${k.textContent} overflows by ${Math.round(a.right - col.right)}`);
            for (const t of texts) {
              if (t.contains(k) || k.contains(t)) continue;
              const b = t.getBoundingClientRect();
              if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)
                out.push(`${k.textContent} covers "${t.textContent!.slice(0, 30)}"`);
            }
          }
          return out;
        });
        expect(clashes, `${width}px`).toEqual([]);
      }
    });

    test("the chords are printed with ⌘ and press with the Cmd key", async ({ page, isMobile }) => {
      test.skip(isMobile, "desktop OS only");
      await page.goto("/p/tauri-explorer");
      const chord = page.locator(".launch-shot-cap .chord");
      await expect(chord).toHaveText(/Command \+ P/); // read as one chord, from the visually hidden text
      const cmd = chord.locator(".key.cap").first();
      await expect(cmd).toHaveText("⌘");
      await page.keyboard.down("Meta");
      await expect(cmd).toHaveAttribute("data-down", "true");
      await page.keyboard.up("Meta");
    });

    test("shortcuts in the copy are the ones a Mac keyboard prints", async ({ page, isMobile }) => {
      test.skip(isMobile, "desktop OS only");
      await page.goto("/p/tauri-explorer");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("⌘P for your filesystem.");
      const reflexes = page.locator(".reflexes");
      await expect(reflexes).toContainText("⇧⌘F5 copies across");
      await expect(reflexes).toContainText("⇧⌘T brings back");
      await expect(reflexes).not.toContainText("Ctrl+");
      await expect(page.locator(".shot figcaption").first()).toContainText("⇧⌘F searches inside files");
    });
  });
});
