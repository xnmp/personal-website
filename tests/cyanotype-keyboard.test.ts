import { test, expect, describe } from "bun:test";
import { ANSI_60, BOARDS, SHIFTED, cornerOf, keysOf, legendDrawable, legendOf, paintKeyboard, placeOf, rowWidth } from "../scripts/kits/cyanotype-keyboard.mjs";

type Key = { label: string; w: number; x: number; y: number; h: number };
const labels = (row: number) => ANSI_60[row].map((k: { label: string }) => k.label);
const widths = (row: number) => ANSI_60[row].map((k: { w: number }) => k.w);

describe("the keyboard's layout is a standard ANSI 60% board", () => {
  test("five rows, each exactly 15u wide", () => {
    expect(ANSI_60).toHaveLength(5);
    for (const row of ANSI_60) expect(rowWidth(row)).toBe(15);
  });

  test("row 1: Esc, the digits, - =, a 2u Backspace", () => {
    expect(labels(0)).toEqual(["Esc", ..."1234567890".split(""), "-", "=", "Backspace"]);
    expect(widths(0).at(-1)).toBe(2);
  });

  test("row 2: a 1.5u Tab, Q to P and the brackets, a 1.5u backslash", () => {
    expect(labels(1)).toEqual(["Tab", ..."QWERTYUIOP".split(""), "[", "]", "\\"]);
    expect([widths(1)[0], widths(1).at(-1)]).toEqual([1.5, 1.5]);
  });

  test("row 3: a 1.75u Caps Lock at the left, a 2.25u Enter at the right", () => {
    expect(labels(2)).toEqual(["Caps Lock", ..."ASDFGHJKL".split(""), ";", "'", "Enter"]);
    expect([widths(2)[0], widths(2).at(-1)]).toEqual([1.75, 2.25]);
  });

  test("row 4: a 2.25u Shift, Z to M and , . /, a 2.75u Shift", () => {
    expect(labels(3)).toEqual(["Shift", ..."ZXCVBNM".split(""), ",", ".", "/", "Shift"]);
    expect([widths(3)[0], widths(3).at(-1)]).toEqual([2.25, 2.75]);
  });

  test("row 5: modifiers at 1.25u either side of a 6.25u space bar", () => {
    expect(labels(4)).toEqual(["Ctrl", "Win", "Alt", "", "Alt", "Fn", "Menu", "Ctrl"]);
    expect(widths(4)).toEqual([1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]);
  });

  test("keys lie edge to edge in their rows, rows one u apart, none overlapping", () => {
    const keys: Key[] = keysOf(ANSI_60);
    expect(keys).toHaveLength(ANSI_60.flat().length);
    for (let row = 0; row < 5; row++) {
      const inRow = keys.filter((k) => k.y === row);
      expect(inRow[0].x).toBe(0);
      for (let i = 1; i < inRow.length; i++) expect(inRow[i].x).toBeCloseTo(inRow[i - 1].x + inRow[i - 1].w, 9);
      const last = inRow.at(-1)!;
      expect(last.x + last.w).toBeCloseTo(15, 9);
    }
  });

  test("Shift gives the US legends", () => {
    expect(SHIFTED["1"]).toBe("!");
    expect(SHIFTED["2"]).toBe("@");
    expect(SHIFTED["-"]).toBe("_");
    expect(SHIFTED[";"]).toBe(":");
    expect(SHIFTED["'"]).toBe('"');
    expect(SHIFTED["/"]).toBe("?");
    expect(SHIFTED["\\"]).toBe("|");
  });

  test("every legend on the board can be drawn, letters bare and punctuation over its shifted pair", () => {
    for (const key of keysOf(ANSI_60)) {
      const { text } = legendOf(key);
      expect(legendDrawable(text)).toBe(true);
    }
    expect(legendOf({ label: "1" }).text).toBe("!\n1");
    expect(legendOf({ label: "Q" }).text).toBe("Q");
    expect(legendOf({ label: "Caps Lock" }).text).toBe("Caps\nLock");
  });

  test("a legend the face has no glyph for is reported, not silently dropped", () => {
    expect(legendDrawable("Ctrl")).toBe(true);
    expect(legendDrawable("Ø")).toBe(false);
  });
});

describe("the boards are posed on the plates they replace", () => {
  test("each pose is a real affine map: the case's top right corner lands on `tr`, and rows and columns are independent", () => {
    for (const spec of Object.values(BOARDS) as (typeof BOARDS)[keyof typeof BOARDS][]) {
      const [x, y] = placeOf(spec, cornerOf(spec));
      expect(x).toBeCloseTo(spec.tr[0], 6);
      expect(y).toBeCloseTo(spec.tr[1], 6);
      const det = spec.u[0] * spec.v[1] - spec.u[1] * spec.v[0];
      expect(Math.abs(det)).toBeGreaterThan(100);
    }
  });

  test("a deeper case margin moves the board's corner out from its keys, not the keys", () => {
    const spec = BOARDS.project;
    const shallow = { ...spec, margin: { ...spec.margin, x: 0.3 } };
    // the keys are where the pose puts them either way; only the case's corner differs
    expect(cornerOf(spec)[0]).toBeGreaterThan(cornerOf(shallow)[0]);
    const [kx, ky] = placeOf(spec, [14, 0.5]);
    const [sx, sy] = placeOf({ ...shallow, tr: placeOf(spec, cornerOf(shallow)) }, [14, 0.5]);
    expect(Math.hypot(kx - sx, ky - sy)).toBeLessThan(1e-6);
  });

  test("a board is not turned over: rows run left to right and one row down is below it", () => {
    for (const spec of Object.values(BOARDS) as (typeof BOARDS)[keyof typeof BOARDS][]) {
      const det = spec.u[0] * spec.v[1] - spec.u[1] * spec.v[0];
      expect(det).toBeGreaterThan(0); // not mirrored (y down)
      expect(spec.u[0]).toBeGreaterThan(0);
      expect(spec.v[1]).toBeGreaterThan(0);
    }
  });
});

describe("the project page's board is a line drawing", () => {
  // the original's keyboard there is white hairlines on dark caps the colour of the print, with a crisp case outline
  const spec = BOARDS.project;
  const [W, H] = spec.canvas as [number, number];
  const GROUND = [14, 56, 98];
  const luma = (rgb: Buffer, x: number, y: number) => 0.299 * rgb[(y * W + x) * 3] + 0.587 * rgb[(y * W + x) * 3 + 1] + 0.114 * rgb[(y * W + x) * 3 + 2];

  test("hairlines are bright, key tops stay dark", async () => {
    const rgb = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) rgb.set(GROUND, i * 3);
    await paintKeyboard(rgb, W, H, "project");
    const ground = 0.299 * GROUND[0] + 0.587 * GROUND[1] + 0.114 * GROUND[2];
    // the middle of the Enter key's cap, clear of its legend, is near the ground's tone
    const [cx, cy] = placeOf(spec, [13.9, 2.62]);
    expect(Math.abs(luma(rgb, Math.round(cx), Math.round(cy)) - ground)).toBeLessThan(45);
    // and the board as a whole has white in it: its hairlines
    const [x0, y0] = placeOf(spec, [8, 0]);
    let peak = 0;
    for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, Math.round(y0) + 160); y++)
      for (let x = Math.max(0, Math.round(x0) - 40); x < Math.min(W, Math.round(x0) + 360); x++) peak = Math.max(peak, luma(rgb, x, y));
    expect(peak).toBeGreaterThan(215);
  }, 60000);
});

describe("painting a board into a canvas", () => {
  const spec = BOARDS.phone;
  const [W, H] = spec.canvas as [number, number];
  const flat = () => {
    const rgb = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) rgb.set([14, 56, 98], i * 3);
    return rgb;
  };

  test("changes the print where the board lies, nowhere else", async () => {
    const rgb = flat();
    await paintKeyboard(rgb, W, H, "phone");
    const at = (x: number, y: number) => [...rgb.subarray((y * W + x) * 3, (y * W + x) * 3 + 3)];
    // far corners are untouched
    expect(at(W - 5, H - 5)).toEqual([14, 56, 98]);
    expect(at(W - 5, 5)).toEqual([14, 56, 98]);
    // the middle of the board's end has been printed over
    const [cx, cy] = placeOf(spec, [13.5, 2.5]);
    expect(at(Math.round(cx), Math.round(cy))).not.toEqual([14, 56, 98]);
  }, 60000);

  test("is deterministic: the same board paints the same pixels", async () => {
    const [a, b] = [flat(), flat()];
    await paintKeyboard(a, W, H, "phone");
    await paintKeyboard(b, W, H, "phone");
    expect(a.equals(b)).toBe(true);
  }, 60000);

  test("refuses a canvas it was not posed on", async () => {
    await expect(paintKeyboard(Buffer.alloc(10 * 10 * 3), 10, 10, "phone")).rejects.toThrow(/canvas/);
  });

  test("a board wholly off its canvas paints nothing", async () => {
    const off = { ...spec, name: "off", tr: [5000, 5000] };
    const rgb = flat();
    await paintKeyboard(rgb, W, H, off);
    expect(rgb.equals(flat())).toBe(true);
  });
});
