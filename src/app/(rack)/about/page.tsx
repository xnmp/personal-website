import type { Metadata } from "next";
import { RunningHead } from "@/components/notebook";
import { Rich } from "@/components/notebook/Rich";
import { Key, Screen } from "@/components/rack";
import { about, publishable } from "@/data/about";

export const metadata: Metadata = {
  title: "About · chong",
  description: about.intro[0],
};

// drafts are for writing in dev; a production build leaves them out
const drafts = process.env.NODE_ENV !== "production";

/** The about page. Its content lives in src/data/about.ts. */
export default function AboutPage() {
  const sections = publishable(about.sections, drafts);
  const facts = publishable(about.facts, drafts);
  return (
    <>
      <RunningHead brand="chong" meta="about" nav={<Key href="/">← all projects</Key>} />
      <main id="content" className="rack-main" tabIndex={-1}>
        <section className={about.portrait ? "detail-hero" : "detail-hero solo"}>
          <div>
            <div className="kicker">{about.kicker}</div>
            <h1>{about.headline}</h1>
            {about.intro.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
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
                <p className="aside-note">
                  <Rich text={s.aside} />
                </p>
              ) : null}
            </div>
            <div>
              {s.body.map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="colophon" aria-label="Facts">
          {facts.map((f) => (
            <div key={f.label}>
              {f.label}
              <strong>
                <Rich text={f.value} />
              </strong>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
