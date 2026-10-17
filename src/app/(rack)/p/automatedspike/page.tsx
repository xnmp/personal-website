import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/automatedspike");

export const metadata = contentField<import("next").Metadata>(content, "metadata");



export default function AutomatedSpikePage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="automatedspike" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="automatedspike" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "this-is-research-into-finding-inventive-decks-for-magic-th")} />
            <Markdown text={contentBlock(content, "full-modern-is-not-working-yet")} />
          </div>
          <div>
            <Screen art="/screens/automatedspike.png" tone="amber" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "python")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "xmage")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "argentum")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "behaviour-cloning")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "reinforcement-learning")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-shape")} inline /></div>
            <h2><Markdown text={contentBlock(content, "brewer-pilot-evaluator-environment")} inline /></h2>
            <Markdown text={contentBlock(content, "from-docs-mission-and-architecture")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "four-parts-with-separate-jobs")} />
            <Markdown text={contentBlock(content, "two-rules-from-the-design-matter-most")} />
            <Markdown text={contentBlock(content, "two-real-engines-are-pinned-next-to-the-python-xmage-and-a")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-starter-engine")} inline /></div>
            <h2><Markdown text={contentBlock(content, "small-on-purpose-and-strict-about-it")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "until-an-upstream-engine-could-run-here-i-wrote-a-starter")} />
            <Markdown text={contentBlock(content, "it-is-deterministic")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-pilots")} inline /></div>
            <h2><Markdown text={contentBlock(content, "a-teacher-then-a-student")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-teacher-is-a-heuristic-pilot-in-pilot-heuristics")} />
            <Markdown text={contentBlock(content, "the-student-learns-combat-only")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-the-teacher-against-two-weak-baselines")}
              caption={contentBlock(content, "caption-from-docs-experiments-starter-prototype-md-win-1-d")}
            >
              <Markdown text={contentBlock(content, "code-800-game-check-frozen-heuristic-teacher-hoeffding-low")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-evidence-rules")} inline /></div>
            <h2><Markdown text={contentBlock(content, "declare-the-test-before-you-run-it")} inline /></h2>
            <Markdown text={contentBlock(content, "evaluation-statistics")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "each-experiment-fixes-its-seeds-decks-opponents-game-count")} />
            <Markdown text={contentBlock(content, "the-alpha-budget-is-0")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "what-failed")} inline /></div>
            <h2><Markdown text={contentBlock(content, "the-negative-results")} inline /></h2>
            <Markdown text={contentBlock(content, "these-are-the-numbers-i-would-hide-if-i-were-selling-it")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-the-first-learning-run-against-the-teacher")}
              caption={contentBlock(content, "caption-304-games-no-technical-outcomes-wins-out-of-16-per")}
            >
              <Markdown text={contentBlock(content, "code-learned-combat-student-304-games-16-per-cell-random-n")} />
            </Plate>
            <ul>
              <li><Markdown text={contentBlock(content, "rl-won-4-of-16-against-the-teacher")} inline /></li>
              <li><Markdown text={contentBlock(content, "the-first-brewing-search-found-nothing")} inline /></li>
              <li><Markdown text={contentBlock(content, "a-tactical-gate-failed")} inline /></li>
              <li><Markdown text={contentBlock(content, "a-tactical-rewrite-did-not-move-scores")} inline /></li>
            </ul>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-corpus")} inline /></div>
            <h2><Markdown text={contentBlock(content, "real-decks-partly-collected")} inline /></h2>
          </div>
          <div>
            <Features>
              <Feature label={contentBlock(content, "label-goldfish-snapshot")}><Markdown text={contentBlock(content, "all-135-modern-archetype-pages-were-fetched-and-normalised")} inline /></Feature>
              <Feature label={contentBlock(content, "label-provenance")}><Markdown text={contentBlock(content, "raw-bytes-are-stored-requests-respect-robots")} inline /></Feature>
              <Feature label={contentBlock(content, "label-gaps")}><Markdown text={contentBlock(content, "the-moxfield-profile-hit-a-cloudflare-block-youtube-discov")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown text={contentBlock(content, "full-modern-is-still-ahead")} inline /></h2>
            <Markdown text={contentBlock(content, "counts-are-from-docs-implementation-status")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-restricted-starter-engine-is-qualified-and-so-are-two")} />
            <Markdown text={contentBlock(content, "a-separate-xmage-pilot-also-plays-the-starter-pool-plus-re")} />
            <OpenQuestion><Markdown text={contentBlock(content, "does-any-of-this-transfer")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialspython-xmage-argentum-sqlite")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintageoctober-2026")} inline /></div>
          <div><Markdown text={contentBlock(content, "statusactive-research-restricted-pool")} inline /></div>
          <div><Markdown text={contentBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="automatedspike" />
    </>
  );
}
