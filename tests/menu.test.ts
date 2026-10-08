import { describe, expect, test } from "bun:test";
import { menuPlacement, nextItem } from "../src/lib/menu";

describe("menuPlacement", () => {
  test("hangs the menu under its button's bottom right, in document px", () => {
    expect(menuPlacement({ bottom: 60, right: 1200 }, 0, 1440)).toEqual({ top: 68, right: 240 });
  });
  test("a scrolled page moves the menu down by the scroll, so it stays with the button", () => {
    expect(menuPlacement({ bottom: 60, right: 1200 }, 500, 1440).top).toBe(568);
  });
  test("a button past the document's right edge never puts the menu past it", () => {
    expect(menuPlacement({ bottom: 40, right: 400 }, 0, 390).right).toBe(0);
  });
  test("fractional rects round to whole px", () => {
    expect(menuPlacement({ bottom: 59.6, right: 1199.4 }, 0.2, 1440, 8)).toEqual({ top: 68, right: 241 });
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
