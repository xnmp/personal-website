import { bindBlock, bindField } from "@/lib/studio/bindings";
import { EditableLink } from "@/components/studio/EditableLink";
import { BoundText } from "@/components/studio/BoundText";
import { EditableText } from "@/components/studio/EditableText";
import type { Metadata } from "next";
import { RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { readAbout, publishable } from "@/data/about";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateAboutMetadata(): Metadata {
  return {
    ...contentField<Metadata>(readContent("about"), "metadata"),
    description: readAbout().intro[0],
    alternates: { canonical: "/" },
  };
}

// drafts are for writing in dev; a production build leaves them out
const drafts = process.env.NODE_ENV !== "production";

/** The about page. Its content lives in content/about.md. */
export function AboutPage() {
  const content = readContent("about");
  const about = readAbout();
  const sourceSections = contentField<{ body: string }[]>(content, "sections");
  const sections = publishable(
    about.sections.map((section, sourceIndex) => ({ ...section, sourceIndex })),
    drafts,
  );
  const facts = publishable(
    about.facts.map((fact, sourceIndex) => ({ ...fact, sourceIndex })),
    drafts,
  );
  return (
    <>
      <RunningHead meta="about" nav={<Key href="/projects">← all projects</Key>} />
      <main id="content" className="rack-main about-page" tabIndex={-1}>
        <div className="about-file-head faceplate">
          <span><EditableText binding={bindField(content, ["kicker"])}>{about.kicker}</EditableText></span>
          <a href="https://github.com/xnmp/personal-website/blob/main/content/about.md">about.md <span aria-hidden="true">↗</span></a>
        </div>
        <section className={about.portrait ? "detail-hero" : "detail-hero solo"}>
          <div>
            <h1><EditableText binding={bindField(content, ["headline"])}>{about.headline}</EditableText></h1>
            <Markdown text={about.intro.join("\n\n")} binding={bindBlock(content, contentField<string>(content, "intro")).binding} />
          </div>
          {about.portrait ? (
            <Screen label={about.portrait.alt} glass={false}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a plain photo in the mat, sized by CSS */}
              <img className="portrait" src={about.portrait.src} alt={about.portrait.alt} />
            </Screen>
          ) : null}
        </section>

        {sections.length > 0 && <nav className="about-contents faceplate" aria-label="On this page">
          <span className="about-contents-label">In this file</span>
          {sections.map((s, index) => <a key={s.heading} href={`#about-section-${index}`}><BoundText text={s.heading} binding={bindField(content, ["sections", s.sourceIndex, "heading"])} /></a>)}
        </nav>}

        {sections.map((s, index) => (
          <section id={`about-section-${index}`} key={s.heading} className="section" data-draft={s.draft ? "" : undefined}>
            <div>
              {s.draft && <span className="draft-tag">draft, hidden in production</span>}
              <h2><EditableLink href={`/projects#${sourceSections[s.sourceIndex].body}`}><EditableText binding={bindField(content, ["sections", s.sourceIndex, "heading"])}>{s.heading}</EditableText></EditableLink></h2>
              {s.aside ? (
                <Markdown text={s.aside} binding={bindField(content, ["sections", s.sourceIndex, "aside"])} paragraphClassName="aside-note" />
              ) : null}
            </div>
            <div>
              <Markdown text={s.body.join("\n\n")} binding={bindBlock(content, sourceSections[s.sourceIndex].body).binding} />
            </div>
          </section>
        ))}

        <section className="colophon" aria-label="Facts">
          {facts.map((f) => (
            <div key={f.label}>
              <EditableText binding={bindField(content, ["facts", f.sourceIndex, "label"])}>{f.label}</EditableText>
              <strong>
                <Markdown text={f.value} binding={bindField(content, ["facts", f.sourceIndex, "value"])} inline />
              </strong>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
