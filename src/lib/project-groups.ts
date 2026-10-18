type AboutSection = { body: string; heading: string };
type Assignment = { section: string; projects: string[] };
type Configuration = { sections: Assignment[]; unassigned?: string };

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Group membership is authored separately; titles and order belong to About. */
export function groupProjects<T extends { slug: string }>(projects: readonly T[], about: readonly AboutSection[], input: unknown) {
  const fail = (message: string): never => { throw new Error(`content/project-groups.md: ${message}`); };
  if (!record(input) || !Array.isArray(input.sections)) fail("sections must be a list");
  const config = input as Configuration;
  if (!Array.isArray(about) || about.some(section => !record(section) ||
    typeof section.body !== "string" || !section.body.trim() ||
    typeof section.heading !== "string" || !section.heading.trim())) fail("About section IDs and titles must be nonempty text");
  const ids = new Set(about.map(section => section.body));
  if (ids.size !== about.length) fail("About section IDs must be unique");
  if (config.unassigned !== undefined && !ids.has(config.unassigned)) fail("unassigned must name an About section");
  const slugs = new Set(projects.map(project => project.slug));
  const sections = new Set<string>();
  const owners = new Map<string, string>();
  for (const assignment of config.sections) {
    if (!record(assignment) || typeof assignment.section !== "string" || !ids.has(assignment.section)) fail("unknown About section");
    if (sections.has(assignment.section)) fail(`section ${assignment.section} appears twice`);
    sections.add(assignment.section);
    if (!Array.isArray(assignment.projects)) fail(`${assignment.section}: projects must be a list`);
    for (const slug of assignment.projects) {
      if (typeof slug !== "string" || !slugs.has(slug)) fail(`unknown project ${String(slug)}`);
      if (owners.has(slug)) fail(`project ${slug} appears twice`);
      owners.set(slug, assignment.section);
    }
  }
  if (sections.size !== ids.size) fail("each About section needs a project group");
  if (!config.unassigned && projects.some(project => !owners.has(project.slug))) fail("every project needs a group");
  return about.map((section, sourceIndex) => ({
    id: section.body,
    heading: section.heading,
    sourceIndex,
    projects: projects.filter(project => (owners.get(project.slug) ?? config.unassigned) === section.body),
  }));
}
