// The phone home's desk, cut from the phone mock's own pixels: the window is
// a device seated on the wooden desk, with the mug and the books of the mock
// standing in front of its lower corners (art/originals/solarpunk-phone.webp).
// The page anchors all three to the window (solarpunk.css, the phone block),
// so they travel with it; the scene behind the page is the same picture with
// the desk, mug and books painted out (plate-phone-nodesk-*), so there is
// never a second desk on the plate to drift away from the window's.
//
// Cut from the plate that still has the desk (plate-phone-{day,night}, the
// mock with the page painted out; the two register, so one set of polygons
// serves both):
//  - the mug and the books: hand-read polygons (mock px, read off 4x crops
//    with a grid), the mug's handle cut open, the edge feathered by 0.7 px;
//  - the desk: the clean planks and the moss along their back edge, between
//    the two (x 190 to 780), mirrored out to the plate's full width so the
//    seam is continuous, its back edge fading out into the foliage above it.
// Writes art/raw/solarpunk/phone-{mug,books,desk}-{day,night}/ (the kit trims
// and shadows them: scripts/kits/solarpunk.mjs).
//   node scripts/kits/solarpunk-phone-props.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const RAW = "art/raw/solarpunk";
const W = 927;

// mock px
const MUG = [[0, 1269.5], [20, 1268], [50, 1267], [80, 1267.5], [100, 1270], [115, 1274], [122, 1279], [124.5, 1284], [125, 1291], [132, 1290], [140, 1290], [152, 1291.5], [165, 1294], [174, 1300], [179, 1309], [182, 1322], [183.7, 1337], [183.5, 1352], [181.5, 1366], [176, 1378], [169, 1388], [161, 1395], [150, 1402], [138, 1407], [131, 1411], [126, 1416], [125, 1426], [125, 1433], [123, 1440], [119, 1446], [112, 1451.5], [100, 1456], [80, 1459], [50, 1460], [20, 1459.5], [0, 1459]];
// the gap between the handle and the body, where the plant behind shows
const MUG_HOLE = [[127, 1308.75], [136.25, 1305], [150, 1305], [162.5, 1311], [168, 1327.5], [170, 1342.5], [168, 1360], [162.5, 1375], [152.5, 1385], [142.5, 1391], [133.75, 1393.75], [127.5, 1391]];
const BOOKS = [[927, 1306], [900, 1310], [885, 1314], [881, 1318], [888, 1324], [889, 1345], [886, 1356], [880, 1357], [865, 1359], [847, 1362], [832, 1366], [821, 1368], [818, 1371], [819, 1375], [825, 1377], [829, 1385], [828, 1397], [825, 1407], [821, 1412], [818, 1416], [797, 1417], [785, 1420], [779, 1425], [780, 1429], [785, 1431], [787, 1450], [785, 1462], [778, 1468], [782, 1472], [795, 1476], [822, 1480], [842, 1487], [860, 1492], [900, 1497], [927, 1497]];

// a polygon's cut from a plate, over its own bounding box (plus a margin), as
// RGBA; `holes` are cut out of it
const cut = async (plate, polys, holes = []) => {
  const all = polys.flat();
  const x0 = Math.max(0, Math.floor(Math.min(...all.map((p) => p[0]))) - 3);
  const y0 = Math.floor(Math.min(...all.map((p) => p[1]))) - 3;
  const x1 = Math.min(W, Math.ceil(Math.max(...all.map((p) => p[0]))) + 3);
  const y1 = Math.ceil(Math.max(...all.map((p) => p[1]))) + 3;
  const [w, h] = [x1 - x0, y1 - y0];
  const K = 8;
  const d = (ring) => `M${ring.map(([x, y]) => `${((x - x0) * K).toFixed(1)},${((y - y0) * K).toFixed(1)}`).join("L")}Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * K}" height="${h * K}"><rect width="100%" height="100%" fill="#000"/><path fill-rule="evenodd" fill="#fff" d="${[...polys, ...holes].map(d).join("")}"/></svg>`;
  const mask = await sharp(Buffer.from(svg)).blur((0.7 * K) / 2).resize(w, h, { kernel: "lanczos3" }).greyscale().raw().toBuffer();
  const { data } = await sharp(plate).extract({ left: x0, top: y0, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = mask[i];
  }
  return { rgba, w, h, x0, y0 };
};

const write = async (name, { rgba, w, h }) => {
  mkdirSync(`${RAW}/${name}`, { recursive: true });
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${RAW}/${name}/${name}.png`);
};

// the desk: planks and moss from y 1368 down to the plate's front edge
// (1503), the middle of the plate between the mug and the books, mirrored out
// to the full width; the back edge fades over its top 16 px
const DESK = { x0: 195, x1: 775, y0: 1368, y1: 1503, fade: 16 };
const desk = async (plate) => {
  const { x0, x1, y0, y1, fade } = DESK;
  const [w, h] = [x1 - x0, y1 - y0];
  const mid = await sharp(plate).extract({ left: x0, top: y0, width: w, height: h }).removeAlpha().png().toBuffer();
  const flip = await sharp(mid).flop().png().toBuffer();
  // centred on the plate: the middle copy, a mirror each side of it
  const left = Math.round((W - w) / 2);
  const canvas = await sharp({ create: { width: W, height: h, channels: 3, background: "#000" } })
    .composite([
      { input: flip, left: left - w, top: 0 },
      { input: flip, left: left + w, top: 0 },
      { input: mid, left, top: 0 },
    ])
    .png()
    .toBuffer();
  const { data } = await sharp(canvas).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(W * h * 4);
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, y / fade);
    const a = Math.round(255 * t * t * (3 - 2 * t));
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      rgba[i * 4] = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = a;
    }
  }
  return { rgba, w: W, h };
};

for (const f of ["day", "night"]) {
  const plate = `${RAW}/plate-phone-${f}/plate-phone-${f}.png`;
  const mug = await cut(plate, [MUG], [MUG_HOLE]);
  const books = await cut(plate, [BOOKS]);
  await write(`phone-mug-${f}`, mug);
  await write(`phone-books-${f}`, books);
  await write(`phone-desk-${f}`, await desk(plate));
  console.log(`${f}: mug ${mug.w}x${mug.h} at ${mug.x0},${mug.y0}; books ${books.w}x${books.h} at ${books.x0},${books.y0}; desk ${W}x${DESK.y1 - DESK.y0} at 0,${DESK.y0}`);
}
