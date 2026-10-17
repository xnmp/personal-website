import { bindBlock } from "@/lib/studio/bindings";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/lambdaquery"), "metadata");
}

export default function LambdaQueryPage() {
  const content = readContent("projects/lambdaquery");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="lambdaquery" />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="lambdaquery" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "queries-built-as-composable-value-objects-fmap-filter-get")} />
          </div>
          <div>
            <Screen art="/screens/lambdaquery.png" tone="amber" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "python")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "4")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "150-tests")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "2017-rebuilt-2026")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-idea")} inline /></div>
            <h2><Markdown {...bindBlock(content, "say-it-once-in-python")} inline /></h2>
            <Markdown {...bindBlock(content, "for-each-school-with-at-least-one-program-the-average-over")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-three-levels-of-correlation")} figureBinding={bindBlock(content, "figure-fig-1-three-levels-of-correlation").binding}
              caption={contentBlock(content, "caption-fig-1-the-count-0-filter-compiles-to-an-exists-sem")} captionBinding={bindBlock(content, "caption-fig-1-the-count-0-filter-compiles-to-an-exists-sem").binding}
            >
              <div className="code-duet">
                <div className="code-panel">
                  <h3><Markdown {...bindBlock(content, "written")} inline /></h3>
                  <Markdown {...bindBlock(content, "code-school-query-lambda-x-x-get-foreign-program-count-0-f")} />
                </div>
                <div className="code-panel">
                  <h3><Markdown {...bindBlock(content, "compiled")} inline /></h3>
                  <Markdown {...bindBlock(content, "code-select-q2-avg-n-s-name-from-school-as-s-left-join-sel")} />
                </div>
              </div>
            </Plate>
            <Markdown {...bindBlock(content, "an-inner-lambda-can-reference-an-outer-lambda-s-row-at-any")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-pipeline")} inline /></div>
            <h2><Markdown {...bindBlock(content, "passes-to-a-fixpoint")} inline /></h2>
          </div>
          <div>
            <ol>
              <li><Markdown {...bindBlock(content, "decorrelate")} inline /></li>
              <li><Markdown {...bindBlock(content, "flatten")} inline /></li>
              <li><Markdown {...bindBlock(content, "optimize-cost-only")} inline /></li>
            </ol>
            <Markdown {...bindBlock(content, "one-hard-won-invariant-straight-from-a-comment-in-compile")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-oracle")} inline /></div>
            <h2><Markdown {...bindBlock(content, "tested-against-two-ground-truths")} inline /></h2>
            <Markdown {...bindBlock(content, "a-quarter-of-the-codebase-is-the-adversarial-suite")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-fixture-data-is-built-to-hurt-a-school-with-zero-depar")} />
            <Markdown {...bindBlock(content, "the-harness-caught-two-genuine-compiler-bugs-both-document")} />
            <ol>
              <li><Markdown {...bindBlock(content, "unparenthesized-or")} inline /></li>
              <li><Markdown {...bindBlock(content, "unscoped-cross-scope-joins")} inline /></li>
            </ol>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown {...bindBlock(content, "the-or-precedence-bug-survived-148-structural-tests-and-fe")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")} labelBinding={bindBlock(content, "label-open-question-ii").binding}><Markdown {...bindBlock(content, "child-to-parent-traversal-many-to-one-get-foreign-and-quer")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialspython-duckdb-networkx")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintage2017-rebuilt-2026")} inline /></div>
          <div><Markdown {...bindBlock(content, "scale4")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-lambdaquery-2-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="lambdaquery" />
    </>
  );
}
