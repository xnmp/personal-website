import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key } from "@/components/rack";
import { ZsyGame } from "@/components/zsy/ZsyGame";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("zheng-shang-you-play"), "metadata");
}

export default function ZsyPlayPage() {
  const content = readContent("zheng-shang-you-play");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="zheng-shang-you" />}
        nav={
          <>
            <Key href="/p/zheng-shang-you"><Markdown {...bindBlock(content, "the-project")} inline allowLinks={false} /></Key>
            <Key href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="zheng-shang-you" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "three-opponents-each-running-the-scripted-strategist-the-s")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rules-briefly")} inline /></div>
            <h2><Markdown {...bindBlock(content, "how-to-play")} inline /></h2>
            <ul style={{ marginTop: 12 }}>
              <li><Markdown {...bindBlock(content, "combinations-singles-pairs-triples-full-houses-straights-o")} inline /></li>
              <li><Markdown {...bindBlock(content, "order-3-lowest-a-then-2-then-the-jokers")} inline /></li>
              <li><Markdown {...bindBlock(content, "bombs-four-or-more-of-a-kind-straight-flushes-beat-any-ord")} inline /></li>
              <li><Markdown {...bindBlock(content, "pick-cards-to-raise-them-the-play-button-names-what-you-ve")} inline /></li>
            </ul>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-a-the-table")} figureBinding={bindBlock(content, "figure-fig-a-the-table").binding}
              caption={contentBlock(content, "caption-fig-a-the-engine-is-the-typescript-port-of-the-tra")} captionBinding={bindBlock(content, "caption-fig-a-the-engine-is-the-typescript-port-of-the-tra").binding}
            >
              <ZsyGame />
            </Plate>
          </div>
        </section>

      </main>
      <Folio slug="zheng-shang-you" />
    </>
  );
}
