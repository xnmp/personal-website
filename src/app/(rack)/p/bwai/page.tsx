import { bindBlock } from "@/lib/studio/bindings";
import { BwaiBench } from "@/components/charts/BwaiBench";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
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
            <Markdown {...bindBlock(content, "body-what-can-i-try-on-one-desktop")} />
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
            <Markdown {...bindBlock(content, "body-turning-replay-commands-into-decisions")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-re-baseline")} inline /></div>
            <h2><Markdown {...bindBlock(content, "my-76-was-measured-against-a-broken-opponent")} inline /></h2>
            <Markdown {...bindBlock(content, "sources-current-state")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-the-opponent-was-broken")} />
            <Plate
              figure={contentBlock(content, "figure-fig-2-nine-paired-arms-against-the-fixed-opponent")} figureBinding={bindBlock(content, "figure-fig-2-nine-paired-arms-against-the-fixed-opponent").binding}
              caption={contentBlock(content, "caption-from-history-md-27-jul-2026-five-arms-shown-same-s")} captionBinding={bindBlock(content, "caption-from-history-md-27-jul-2026-five-arms-shown-same-s").binding}
            >
              <Markdown {...bindBlock(content, "code-re-baseline-vs-the-fixed-opponent-n-50-per-arm-seeds")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-getting-the-opening-to-work")} />
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
