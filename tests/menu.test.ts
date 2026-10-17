import { describe, expect, test } from "bun:test";
import { menuPlacement, nextItem } from "../src/lib/menu";

describe("menuPlacement", () => {
  const viewport = { width: 1440, height: 900 };
  const menu = { width: 230, height: 340 };
  test("hangs a menu below its trigger, aligned to its right edge", () => {
    expect(menuPlacement({ top: 20, bottom: 60, right: 1200 }, menu, viewport)).toEqual({ top: 68, left: 970, maxHeight: 340 });
  });
  test("clamps a left-rail trigger and an offscreen right edge", () => {
    expect(menuPlacement({ top: 200, bottom: 240, right: 79 }, menu, viewport).left).toBe(14);
    expect(menuPlacement({ top: 20, bottom: 60, right: 1600 }, menu, viewport).left).toBe(1196);
  });
  test("opens upward when that side has more room", () => {
    expect(menuPlacement({ top: 700, bottom: 740, right: 1200 }, menu, viewport)).toEqual({ top: 352, left: 970, maxHeight: 340 });
  });
  test("constrains a tall menu to the larger available side of a short viewport", () => {
    const at = menuPlacement({ top: 220, bottom: 260, right: 79 }, menu, { width: 900, height: 390 });
    expect(at).toEqual({ top: 14, left: 14, maxHeight: 198 });
  });
});

describe("nextItem", () => {
  test("arrows move one item and wrap at either end", () => {
    expect(nextItem("ArrowDown", 0, 7)).toBe(1);
    expect(nextItem("ArrowDown", 6, 7)).toBe(0);
    expect(nextItem("ArrowUp", 0, 7)).toBe(6);
    expect(nextItem("ArrowUp", 3, 7)).toBe(2);
  });
  test("Home and End go to the ends", () => {
    expect(nextItem("Home", 4, 7)).toBe(0);
    expect(nextItem("End", 1, 7)).toBe(6);
  });
  test("from no focused item, Down starts at the first and Up at the last", () => {
    expect(nextItem("ArrowDown", -1, 7)).toBe(0);
    expect(nextItem("ArrowUp", -1, 7)).toBe(6);
  });
  test("other keys and an empty menu are left alone", () => {
    expect(nextItem("Enter", 2, 7)).toBeNull();
    expect(nextItem("a", 2, 7)).toBeNull();
    expect(nextItem("ArrowDown", 0, 0)).toBeNull();
  });
});
