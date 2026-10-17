import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export interface AboutSection {
  /** the tape label above the heading */
  kicker: string;
  heading: string;
  /** a short note under the heading, in the sheet's left column */
  aside?: string;
  body: string[];
  draft?: boolean;
}

export interface AboutFact {
  label: string;
  value: string;
  draft?: boolean;
}

export interface About {
  kicker: string;
  headline: string;
  intro: string[];
  portrait?: { src: string; alt: string };
  sections: AboutSection[];
  /** printed on the spec strip at the foot of the page */
  facts: AboutFact[];
}
const content = readContent("about");
type AboutFields = Omit<About, "intro" | "sections"> & {
  intro: string;
  sections: (Omit<AboutSection, "body"> & { body: string })[];
};
const fields = content.data as unknown as AboutFields;
const paragraphs = (name: string) => contentBlock(content, name).split(/\n\s*\n/);

export const about: About = {
  ...fields,
  intro: paragraphs(contentField<string>(content, "intro")),
  sections: fields.sections.map(section => ({ ...section, body: paragraphs(section.body) })),
};

/** Drafts are written in dev and left out of production. Pure, for tests. */
export function publishable<T extends { draft?: boolean }>(items: readonly T[], includeDrafts: boolean): T[] {
  return items.filter((i) => includeDrafts || !i.draft);
}
