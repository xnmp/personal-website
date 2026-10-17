import type { Metadata } from "next";
import { RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { about, publishable } from "@/data/about";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export const metadata: Metadata = {
  ...contentField<Metadata>(readContent("about"), "metadata"),
  description: about.intro[0],
};

// drafts are for writing in dev; a production build leaves them out
const drafts = process.env.NODE_ENV !== "production";

/** The about page. Its content lives in content/about.md. */
export default function AboutPage() {
  const sections = publishable(about.sections, drafts);
  const facts = publishable(about.facts, drafts);
  return (
    <>
      <RunningHead meta="about" nav={<Key href="/">← all projects</Key>} />
      <main id="content" className="rack-main" tabIndex={-1}>
        <section className={about.portrait ? "detail-hero" : "detail-hero solo"}>
          <div>
            <div className="kicker">{about.kicker}</div>
            <h1>{about.headline}</h1>
            <Markdown text={about.intro.join("\n\n")} />
          </div>
          {about.portrait ? (
            <Screen label={about.portrait.alt} glass={false}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a plain photo in the mat, sized by CSS */}
              <img className="portrait" src={about.portrait.src} alt={about.portrait.alt} />
            </Screen>
          ) : null}
        </section>

        {sections.map((s) => (
          <section key={s.heading} className="section" data-draft={s.draft ? "" : undefined}>
            <div>
              <div className="section-kicker">
                {s.kicker}
                {s.draft ? <span className="draft-tag"> · draft, hidden in production</span> : null}
              </div>
              <h2>{s.heading}</h2>
              {s.aside ? (
                <Markdown text={s.aside} paragraphClassName="aside-note" />
              ) : null}
            </div>
            <div>
              <Markdown text={s.body.join("\n\n")} />
            </div>
          </section>
        ))}

        <section className="colophon" aria-label="Facts">
          {facts.map((f) => (
            <div key={f.label}>
              {f.label}
              <strong>
                <Markdown text={f.value} inline />
              </strong>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
