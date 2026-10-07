#!/usr/bin/env node
// Capture the /og/<card> routes to the Next.js metadata image files.
// Needs a running server (bun run dev) and Playwright:  node scripts/render-og.mjs [baseUrl]
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3000";
const cards = {
  home: ["src/app/opengraph-image.png", "src/app/twitter-image.png"],
  "tauri-explorer": [
    "src/app/(rack)/p/tauri-explorer/opengraph-image.png",
    "src/app/(rack)/p/tauri-explorer/twitter-image.png",
  ],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2, colorScheme: "dark" });
for (const [card, outs] of Object.entries(cards)) {
  await page.goto(`${base}/og/${card}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; } .led[data-blink=true]::after { animation: none !important; }" }); // dev badge; the blinking lamp frozen lit
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const shot = await page.screenshot({ type: "png" });
  const png = await sharp(shot).resize(1200, 630).png({ compressionLevel: 9 }).toBuffer();
  for (const out of outs) await sharp(png).toFile(out);
  console.log(card, "→", outs.join(", "));
}
await browser.close();
