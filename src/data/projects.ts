import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import type { Project, Shelf } from "@/lib/project";
import { projectEntry } from "@/lib/project-content";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export * from "@/lib/project";

const entries = readdirSync(join(process.cwd(), "content/projects"))
  .filter(name => name.endsWith(".md"))
  .map(name => {
    const entry = projectEntry(readContent(`projects/${name.slice(0, -3)}`));
    if (`${entry.slug}.md` !== name) throw new Error(`content/projects/${name}: filename must match slug`);
    return entry;
  })
  .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

export const projects: Project[] = entries.map((entry, i) => ({
  ...entry, number: String(i + 1).padStart(2, "0"),
}));

export const bySlug = new Map(projects.map(p => [p.slug, p]));

export function project(slug: string): Project {
  const entry = bySlug.get(slug);
  if (!entry) throw new Error(`no project "${slug}" in content/projects/`);
  return entry;
}

const home = readContent("home");
export const FLAGSHIP = contentField<string>(home, "flagship");
export const FEATURED = contentField<string[]>(home, "featured");
export const shelves = contentField<{ id: Shelf; label: string; note: string }[]>(home, "shelves");

// A stale featured link must fail the build, including when no tests are run.
[FLAGSHIP, ...FEATURED].forEach(project);
if (new Set([FLAGSHIP, ...FEATURED]).size !== FEATURED.length + 1) {
  throw new Error("content/home.md: flagship and featured projects must be unique");
}
