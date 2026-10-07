import { describe, expect, test } from "bun:test";
import { rank, type Searchable } from "../src/lib/search";
import { projects } from "../src/data/projects";

const item = (title: string, extra: Partial<Searchable> = {}): Searchable => ({
  title,
  heading: "",
  number: "00",
  index: "",
  tags: [],
  ...extra,
});

describe("rank", () => {
  test("a title that starts with the query beats a tag that merely contains it", () => {
    const ballast = item("Ballast", { tags: ["desktop"] });
    const eskiv = item("Eskiv");
    expect(rank([ballast, eskiv], "esk").map((p) => p.title)).toEqual(["Eskiv", "Ballast"]);
  });

  test("on the real rack, typing the start of a project's name puts it first", () => {
    const misses = projects.filter((p) => rank(projects, p.title.slice(0, 3))[0].slug !== p.slug).map((p) => p.title);
    expect(misses).toEqual([]);
  });

  test("tiers: title prefix, title word, title substring, heading, then tags", () => {
    const items = [
      item("Tagged", { tags: ["frog"] }),
      item("Heading", { heading: "a frog in a pond" }),
      item("Leapfrog"),
      item("Tableau Frog"),
      item("Frogger"),
    ];
    expect(rank(items, "frog").map((p) => p.title)).toEqual(["Frogger", "Tableau Frog", "Leapfrog", "Heading", "Tagged"]);
  });

  test("ties keep the input order", () => {
    const items = [item("Alpha one"), item("Alpha two")];
    expect(rank(items, "alpha").map((p) => p.title)).toEqual(["Alpha one", "Alpha two"]);
  });

  test("an empty or blank query returns everything; no match returns nothing", () => {
    const items = [item("A"), item("B")];
    expect(rank(items, "")).toEqual(items);
    expect(rank(items, "   ")).toEqual(items);
    expect(rank(items, "zzz")).toEqual([]);
  });

  test("case and surrounding space don't matter, and a huge query doesn't throw", () => {
    const items = [item("Scrivo")];
    expect(rank(items, "  SCRI ")).toEqual(items);
    expect(rank(items, "x".repeat(100_000))).toEqual([]);
  });
});
