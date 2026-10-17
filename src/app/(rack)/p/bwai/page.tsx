import { BwaiBench } from "@/components/charts/BwaiBench";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/bwai");

export const metadata = contentField<import("next").Metadata>(content, "metadata");


export default function BwaiPage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="bwai" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="bwai" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "i-played-brood-war-competitively-once")} />
          </div>
          <div>
            <Screen art="/screens/bwai.png" tone="cyan" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "openbw")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "c-pybind11")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "behaviour-cloning")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "stages-0-to-3-done")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "before-any-code")} inline /></div>
            <h2><Markdown text={contentBlock(content, "the-feasibility-audit")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-first-artifact-in-the-repo-is-a-research-report-not-a")} />
            <Markdown text={contentBlock(content, "so-the-project-follows-the-report-s-own-first-recommendati")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "stage-0")} inline /></div>
            <h2><Markdown text={contentBlock(content, "stage-0-is-the-engine-fast-enough")} inline /></h2>
            <Markdown text={contentBlock(content, "aggregate-openbw-frames-per-second-by-parallel-instance-co")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-40-000-frames-a-second")}
              caption={contentBlock(content, "caption-fig-1-roughly-3-400-games-an-hour-before-gpu-infer")}
            >
              <BwaiBench />
            </Plate>
            <Markdown text={contentBlock(content, "torchcraft-and-stardata-tooling-were-archived-by-meta-in-2")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-vocabulary")} inline /></div>
            <h2><Markdown text={contentBlock(content, "recovering-intent-from-replays")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "replays-record-commands-not-decisions")} />
            <Markdown text={contentBlock(content, "stage-3-s-smoke-test-was-a-deliberately-tiny-1")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-re-baseline")} inline /></div>
            <h2><Markdown text={contentBlock(content, "my-76-was-measured-against-a-broken-opponent")} inline /></h2>
            <Markdown text={contentBlock(content, "sources-current-state")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-current-champion-is-champion-bc-v4")} />
            <Markdown text={contentBlock(content, "the-opponent-was-an-openbw-port-of-blizzard-s-protoss-ai-s")} />
            <Markdown text={contentBlock(content, "against-the-fixed-opponent-the-champion-won-0-of-50-games")} />
            <Plate
              figure={contentBlock(content, "figure-fig-2-nine-paired-arms-against-the-fixed-opponent")}
              caption={contentBlock(content, "caption-from-history-md-27-jul-2026-five-arms-shown-same-s")}
            >
              <Markdown text={contentBlock(content, "code-re-baseline-vs-the-fixed-opponent-n-50-per-arm-seeds")} />
            </Plate>
            <Markdown text={contentBlock(content, "none-of-the-levers-i-had-been-counting-on-moved-it")} />
            <Markdown text={contentBlock(content, "the-0-at-t-0")} />
            <Markdown text={contentBlock(content, "corrections-are-made-in-place")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown text={contentBlock(content, "6-770-pvp-replays-is-20-less-than-alphastar-had")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")}><Markdown text={contentBlock(content, "macro-actions-cap-the-agent-at-human-plausible-mechanics-w")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialsc-pybind11-pytorch-openbw")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintage2026-stages-0-to-3-done-stage-4-open")} inline /></div>
          <div><Markdown text={contentBlock(content, "scale40k-fps-6-770-replays-10")} inline /></div>
          <div><Markdown text={contentBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="bwai" />
    </>
  );
}
