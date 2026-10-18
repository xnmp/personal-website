import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/automatedspike"), "metadata");
}

export default function AutomatedSpikePage() {
  const content = readContent("projects/automatedspike");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="automatedspike" />}
        nav={
          <>
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="automatedspike" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "introduction")} />
          </div>
          <div>
            <Screen art="/screens/automatedspike.png" tone="amber" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "python")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "xmage")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "argentum")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "behaviour-cloning")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "reinforcement-learning")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-shape")} inline /></div>
            <h2><Markdown {...bindBlock(content, "brewer-pilot-evaluator-environment")} inline /></h2>
            <Markdown {...bindBlock(content, "from-docs-mission-and-architecture")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-something-to-build-decks-something-to-play-them")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-starter-engine")} inline /></div>
            <h2><Markdown {...bindBlock(content, "small-on-purpose-and-strict-about-it")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-starting-with-a-very-small-card-pool")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-pilots")} inline /></div>
            <h2><Markdown {...bindBlock(content, "a-teacher-then-a-student")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-learning-from-a-scripted-player")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-the-teacher-against-two-weak-baselines")} figureBinding={bindBlock(content, "figure-fig-1-the-teacher-against-two-weak-baselines").binding}
              caption={contentBlock(content, "caption-from-docs-experiments-starter-prototype-md-win-1-d")} captionBinding={bindBlock(content, "caption-from-docs-experiments-starter-prototype-md-win-1-d").binding}
            >
              <Markdown {...bindBlock(content, "code-800-game-check-frozen-heuristic-teacher-hoeffding-low")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-evidence-rules")} inline /></div>
            <h2><Markdown {...bindBlock(content, "declare-the-test-before-you-run-it")} inline /></h2>
            <Markdown {...bindBlock(content, "evaluation-statistics")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-trying-not-to-fool-myself-with-a-good-run")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "what-failed")} inline /></div>
            <h2><Markdown {...bindBlock(content, "the-negative-results")} inline /></h2>
            <Markdown {...bindBlock(content, "these-are-the-numbers-i-would-hide-if-i-were-selling-it")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-the-first-learning-run-against-the-teacher")} figureBinding={bindBlock(content, "figure-fig-2-the-first-learning-run-against-the-teacher").binding}
              caption={contentBlock(content, "caption-304-games-no-technical-outcomes-wins-out-of-16-per")} captionBinding={bindBlock(content, "caption-304-games-no-technical-outcomes-wins-out-of-16-per").binding}
            >
              <Markdown {...bindBlock(content, "code-learned-combat-student-304-games-16-per-cell-random-n")} />
            </Plate>
            <Markdown {...bindBlock(content, "body-copying-the-teacher-was-easier-than-improving-on-it")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-corpus")} inline /></div>
            <h2><Markdown {...bindBlock(content, "real-decks-partly-collected")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-collecting-things-to-try")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown {...bindBlock(content, "full-modern-is-still-ahead")} inline /></h2>
            <Markdown {...bindBlock(content, "counts-are-from-docs-implementation-status")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-moving-onto-xmage")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialspython-xmage-argentum-sqlite")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintageoctober-2026")} inline /></div>
          <div><Markdown {...bindBlock(content, "statusactive-research-restricted-pool")} inline /></div>
          <div><Markdown {...bindBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="automatedspike" />
    </>
  );
}
