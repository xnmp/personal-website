import { bindBlock } from "@/lib/studio/bindings";
import { BwaiBench } from "@/components/charts/BwaiBench";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/bwai"), "metadata");
}

export default function BwaiPage() {
  const content = readContent("projects/bwai");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="bwai" />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="bwai" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "i-played-brood-war-competitively-once")} />
          </div>
          <div>
            <Screen art="/screens/bwai.png" tone="cyan" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "openbw")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "c-pybind11")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "behaviour-cloning")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "stages-0-to-3-done")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "before-any-code")} inline /></div>
            <h2><Markdown {...bindBlock(content, "the-feasibility-audit")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-first-artifact-in-the-repo-is-a-research-report-not-a")} />
            <Markdown {...bindBlock(content, "so-the-project-follows-the-report-s-own-first-recommendati")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "stage-0")} inline /></div>
            <h2><Markdown {...bindBlock(content, "stage-0-is-the-engine-fast-enough")} inline /></h2>
            <Markdown {...bindBlock(content, "aggregate-openbw-frames-per-second-by-parallel-instance-co")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-40-000-frames-a-second")} figureBinding={bindBlock(content, "figure-fig-1-40-000-frames-a-second").binding}
              caption={contentBlock(content, "caption-fig-1-roughly-3-400-games-an-hour-before-gpu-infer")} captionBinding={bindBlock(content, "caption-fig-1-roughly-3-400-games-an-hour-before-gpu-infer").binding}
            >
              <BwaiBench />
            </Plate>
            <Markdown {...bindBlock(content, "torchcraft-and-stardata-tooling-were-archived-by-meta-in-2")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-vocabulary")} inline /></div>
            <h2><Markdown {...bindBlock(content, "recovering-intent-from-replays")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "replays-record-commands-not-decisions")} />
            <Markdown {...bindBlock(content, "stage-3-s-smoke-test-was-a-deliberately-tiny-1")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-re-baseline")} inline /></div>
            <h2><Markdown {...bindBlock(content, "my-76-was-measured-against-a-broken-opponent")} inline /></h2>
            <Markdown {...bindBlock(content, "sources-current-state")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-current-champion-is-champion-bc-v4")} />
            <Markdown {...bindBlock(content, "the-opponent-was-an-openbw-port-of-blizzard-s-protoss-ai-s")} />
            <Markdown {...bindBlock(content, "against-the-fixed-opponent-the-champion-won-0-of-50-games")} />
            <Plate
              figure={contentBlock(content, "figure-fig-2-nine-paired-arms-against-the-fixed-opponent")} figureBinding={bindBlock(content, "figure-fig-2-nine-paired-arms-against-the-fixed-opponent").binding}
              caption={contentBlock(content, "caption-from-history-md-27-jul-2026-five-arms-shown-same-s")} captionBinding={bindBlock(content, "caption-from-history-md-27-jul-2026-five-arms-shown-same-s").binding}
            >
              <Markdown {...bindBlock(content, "code-re-baseline-vs-the-fixed-opponent-n-50-per-arm-seeds")} />
            </Plate>
            <Markdown {...bindBlock(content, "none-of-the-levers-i-had-been-counting-on-moved-it")} />
            <Markdown {...bindBlock(content, "the-0-at-t-0")} />
            <Markdown {...bindBlock(content, "corrections-are-made-in-place")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown {...bindBlock(content, "6-770-pvp-replays-is-20-less-than-alphastar-had")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")} labelBinding={bindBlock(content, "label-open-question-ii").binding}><Markdown {...bindBlock(content, "macro-actions-cap-the-agent-at-human-plausible-mechanics-w")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialsc-pybind11-pytorch-openbw")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintage2026-stages-0-to-3-done-stage-4-open")} inline /></div>
          <div><Markdown {...bindBlock(content, "scale40k-fps-6-770-replays-10")} inline /></div>
          <div><Markdown {...bindBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="bwai" />
    </>
  );
}
