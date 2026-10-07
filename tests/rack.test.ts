import { test, expect, describe } from "bun:test";
import { ledFor, projects, bySlug, type Status } from "../src/data/projects";
import { nextStop } from "../src/components/rack/RackKeys";
import { isQuickOpen, legendFor } from "../src/components/launch/keyboard";

describe("ledFor", () => {
  test("alpha blinks the signal LED", () => {
    expect(ledFor("alpha")).toEqual({ color: "signal", on: true, blink: true });
  });
  test("a complete project's LED is dark, not lit", () => {
    expect(ledFor("complete").on).toBe(false);
  });
  test("every status maps to a lit-or-dark LED of a known colour", () => {
    const statuses: Status[] = ["alpha", "producing", "paused", "complete"];
    for (const s of statuses) expect(["green", "amber", "signal"]).toContain(ledFor(s).color);
  });
});

describe("project catalogue", () => {
  test("slugs are unique and every project resolves by slug", () => {
    expect(bySlug.size).toBe(projects.length);
  });
  test("module numbers run 01..N with no gaps or repeats", () => {
    const nums = projects.map((p) => p.number);
    expect(nums).toEqual(projects.map((_, i) => String(i + 1).padStart(2, "0")));
  });
  test("every project links its own detail page and screen art", () => {
    for (const p of projects) {
      expect(p.href).toBe(`/p/${p.slug}`);
      expect(p.art.startsWith("/screens/")).toBe(true);
    }
  });
  test("private or absent repos are never linked", () => {
    for (const slug of ["ballast", "bwai", "ashen-cathedral", "automatedspike"]) {
      expect(bySlug.get(slug)?.repo).toBeUndefined();
    }
  });
});

describe("nextStop (j/k focus movement)", () => {
  test("first press lands on the first module", () => {
    expect(nextStop(-1, 5, "j")).toBe(0);
    expect(nextStop(-1, 5, "k")).toBe(0);
  });
  test("moves one step and clamps at both ends", () => {
    expect(nextStop(2, 5, "j")).toBe(3);
    expect(nextStop(4, 5, "j")).toBe(4);
    expect(nextStop(0, 5, "k")).toBe(0);
  });
  test("an empty rack has nowhere to go", () => {
    expect(nextStop(-1, 0, "j")).toBe(-1);
  });
});

describe("launch keyboard", () => {
  const ev = (key: string, mods: Partial<Record<"ctrlKey" | "metaKey" | "shiftKey" | "altKey", boolean>> = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  });
  test("Ctrl+P and Cmd+P are quick open, in either case", () => {
    expect(isQuickOpen(ev("p", { ctrlKey: true }))).toBe(true);
    expect(isQuickOpen(ev("P", { metaKey: true }))).toBe(true);
  });
  test("the palette chords are not quick open", () => {
    expect(isQuickOpen(ev("P", { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isQuickOpen(ev("p", { ctrlKey: true, altKey: true }))).toBe(false);
    expect(isQuickOpen(ev("p"))).toBe(false);
  });
  test("legends match what is printed on the caps", () => {
    expect(legendFor("Control")).toBe("Ctrl");
    expect(legendFor("p")).toBe("P");
    expect(legendFor("`")).toBe("`");
    expect(legendFor("Shift")).toBe("Shift");
    expect(legendFor(" ")).toBe("Space");
  });
});
