import { bindBlock } from "@/lib/studio/bindings";
import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Markdown {...bindBlock(content, "this-is-research-into-finding-inventive-decks-for-magic-th")} />
            <Markdown {...bindBlock(content, "full-modern-is-not-working-yet")} />
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
            <Markdown {...bindBlock(content, "four-parts-with-separate-jobs")} />
            <Markdown {...bindBlock(content, "two-rules-from-the-design-matter-most")} />
            <Markdown {...bindBlock(content, "two-real-engines-are-pinned-next-to-the-python-xmage-and-a")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-starter-engine")} inline /></div>
            <h2><Markdown {...bindBlock(content, "small-on-purpose-and-strict-about-it")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "until-an-upstream-engine-could-run-here-i-wrote-a-starter")} />
            <Markdown {...bindBlock(content, "it-is-deterministic")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-pilots")} inline /></div>
            <h2><Markdown {...bindBlock(content, "a-teacher-then-a-student")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-teacher-is-a-heuristic-pilot-in-pilot-heuristics")} />
            <Markdown {...bindBlock(content, "the-student-learns-combat-only")} />
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
            <Markdown {...bindBlock(content, "each-experiment-fixes-its-seeds-decks-opponents-game-count")} />
            <Markdown {...bindBlock(content, "the-alpha-budget-is-0")} />
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
            <ul>
              <li><Markdown {...bindBlock(content, "rl-won-4-of-16-against-the-teacher")} inline /></li>
              <li><Markdown {...bindBlock(content, "the-first-brewing-search-found-nothing")} inline /></li>
              <li><Markdown {...bindBlock(content, "a-tactical-gate-failed")} inline /></li>
              <li><Markdown {...bindBlock(content, "a-tactical-rewrite-did-not-move-scores")} inline /></li>
            </ul>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-corpus")} inline /></div>
            <h2><Markdown {...bindBlock(content, "real-decks-partly-collected")} inline /></h2>
          </div>
          <div>
            <Features>
              <Feature label={contentBlock(content, "label-goldfish-snapshot")} labelBinding={bindBlock(content, "label-goldfish-snapshot").binding}><Markdown {...bindBlock(content, "all-135-modern-archetype-pages-were-fetched-and-normalised")} inline /></Feature>
              <Feature label={contentBlock(content, "label-provenance")} labelBinding={bindBlock(content, "label-provenance").binding}><Markdown {...bindBlock(content, "raw-bytes-are-stored-requests-respect-robots")} inline /></Feature>
              <Feature label={contentBlock(content, "label-gaps")} labelBinding={bindBlock(content, "label-gaps").binding}><Markdown {...bindBlock(content, "the-moxfield-profile-hit-a-cloudflare-block-youtube-discov")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown {...bindBlock(content, "full-modern-is-still-ahead")} inline /></h2>
            <Markdown {...bindBlock(content, "counts-are-from-docs-implementation-status")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-restricted-starter-engine-is-qualified-and-so-are-two")} />
            <Markdown {...bindBlock(content, "a-separate-xmage-pilot-also-plays-the-starter-pool-plus-re")} />
            <OpenQuestion><Markdown {...bindBlock(content, "does-any-of-this-transfer")} inline /></OpenQuestion>
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
