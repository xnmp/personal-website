import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
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
            <Markdown {...bindBlock(content, "body-untangling-the-nested-queries")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-oracle")} inline /></div>
            <h2><Markdown {...bindBlock(content, "tested-against-two-ground-truths")} inline /></h2>
            <Markdown {...bindBlock(content, "a-quarter-of-the-codebase-is-the-adversarial-suite")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-running-the-same-question-in-python-and-sql")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-what-id-work-on-next")} />
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
