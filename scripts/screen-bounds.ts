// bun scripts/screen-bounds.ts: measure where each screen art's drawing sits
// in its mask (public/screens/*.png) and write src/data/screen-bounds.json,
// which the Screen component hands to the styles as --drawn-*. Run it after
// adding or redrawing an art; tests/projects.test.ts fails until you do.
import sharp from "sharp";
import { readdirSync, writeFileSync } from "node:fs";
import { drawnBounds, type DrawnBounds } from "../src/lib/drawn-bounds";

const dir = "public/screens";
const bounds: Record<string, DrawnBounds> = {};
for (const name of readdirSync(dir).filter((n) => n.endsWith(".png")).sort()) {
  const { data, info } = await sharp(`${dir}/${name}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = drawnBounds(data, info.width, info.height, info.channels);
  if (b) bounds[`/screens/${name}`] = b;
}
writeFileSync("src/data/screen-bounds.json", JSON.stringify(bounds, null, 2) + "\n");
console.log(`measured ${Object.keys(bounds).length} screens`);
