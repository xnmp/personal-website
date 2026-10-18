import { describe, expect, test } from "bun:test";
import { groupProjects } from "../src/lib/project-groups";

const about = [
  { body: "work", heading: "Workflows" },
  { body: "experiments", heading: "Experiments" },
];
const projects = [{ slug: "editor" }, { slug: "new-project" }, { slug: "game" }];
const config = { unassigned: "experiments", sections: [
  { section: "experiments", projects: ["game"] },
  { section: "work", projects: ["editor"] },
] };

describe("project groups", () => {
  test("every project appears once, in catalogue order, under the matching About heading", () => {
    const result = groupProjects(projects, about, config);
    expect(result.map(group => [group.heading, group.projects.map(project => project.slug)])).toEqual([
      ["Workflows", ["editor"]], ["Experiments", ["new-project", "game"]],
    ]);
    expect(projects).toEqual([{ slug: "editor" }, { slug: "new-project" }, { slug: "game" }]);
  });
  test("renaming and reordering About changes the groups without reassigning projects", () => {
    const sections = [{ ...about[1], heading: "New heading" }, about[0]];
    expect(groupProjects(projects, sections, config).map(group => [group.heading, group.projects.map(project => project.slug)])).toEqual([
      ["New heading", ["new-project", "game"]], ["Workflows", ["editor"]],
    ]);
  });
  test("empty categories remain visible, and unassigned projects require an explicit destination", () => {
    expect(groupProjects([], about, { ...config, sections: about.map(section => ({ section: section.body, projects: [] })) }).map(group => group.projects)).toEqual([[], []]);
    expect(() => groupProjects(projects, about, { ...config, unassigned: undefined })).toThrow("every project needs a group");
  });
  test("invalid or ambiguous membership fails clearly instead of losing or duplicating projects", () => {
    for (const input of [
      null,
      { sections: null },
      { ...config, unassigned: "missing" },
      { ...config, sections: [{ section: "work", projects: ["missing"] }, config.sections[0]] },
      { ...config, sections: [{ section: "work", projects: ["game"] }, config.sections[0]] },
      { ...config, sections: [config.sections[0], config.sections[0]] },
      { ...config, sections: [{ section: "missing", projects: [] }, config.sections[0]] },
      { ...config, sections: [{ section: "work", projects: null }, config.sections[0]] },
    ]) expect(() => groupProjects(projects, about, input)).toThrow("content/project-groups.md:");
  });
});
