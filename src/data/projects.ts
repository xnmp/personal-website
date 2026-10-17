import { cache } from "react";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import type { Project, Shelf } from "@/lib/project";
import { projectEntry } from "@/lib/project-content";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export * from "@/lib/project";

export const readProjectCatalog = cache(function readProjectCatalog() {
  const entries = readdirSync(join(process.cwd(), "content/projects"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const entry = projectEntry(readContent(`projects/${name.slice(0, -3)}`));
      if (`${entry.slug}.md` !== name)
        throw new Error(`content/projects/${name}: filename must match slug`);
      return entry;
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  const projects: Project[] = entries.map((entry, i) => ({
    ...entry,
    number: String(i + 1).padStart(2, "0"),
  }));

  const home = readContent("home");
  const flagship = contentField<string>(home, "flagship");
  const featured = contentField<string[]>(home, "featured");
  const shelves = contentField<{ id: Shelf; label: string; note: string }[]>(
    home,
    "shelves",
  );
  const project = (slug: string): Project => {
    const entry = projects.find((p) => p.slug === slug);
    if (!entry) throw new Error(`no project "${slug}" in content/projects/`);
    return entry;
  };
  [flagship, ...featured].forEach(project);
  if (new Set([flagship, ...featured]).size !== featured.length + 1)
    throw new Error(
      "content/home.md: flagship and featured projects must be unique",
    );
  return { projects, project, FLAGSHIP: flagship, FEATURED: featured, shelves };
});

// Compatibility exports for build-time tools. Rendered pages read a fresh catalogue.
export const { projects, project, FLAGSHIP, FEATURED, shelves } =
  readProjectCatalog();
export const bySlug = new Map(projects.map((p) => [p.slug, p]));
