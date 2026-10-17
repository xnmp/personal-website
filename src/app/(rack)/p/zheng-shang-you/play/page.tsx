import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key } from "@/components/rack";
import { ZsyGame } from "@/components/zsy/ZsyGame";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("zheng-shang-you-play");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function ZsyPlayPage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="zheng-shang-you" />}
        nav={
          <>
            <Key href="/p/zheng-shang-you"><Markdown text={contentBlock(content, "the-project")} inline /></Key>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="zheng-shang-you" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "three-opponents-each-running-the-scripted-strategist-the-s")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-rules-briefly")} inline /></div>
            <h2><Markdown text={contentBlock(content, "how-to-play")} inline /></h2>
            <ul style={{ marginTop: 12 }}>
              <li><Markdown text={contentBlock(content, "combinations-singles-pairs-triples-full-houses-straights-o")} inline /></li>
              <li><Markdown text={contentBlock(content, "order-3-lowest-a-then-2-then-the-jokers")} inline /></li>
              <li><Markdown text={contentBlock(content, "bombs-four-or-more-of-a-kind-straight-flushes-beat-any-ord")} inline /></li>
              <li><Markdown text={contentBlock(content, "pick-cards-to-raise-them-the-play-button-names-what-you-ve")} inline /></li>
            </ul>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-a-the-table")}
              caption={contentBlock(content, "caption-fig-a-the-engine-is-the-typescript-port-of-the-tra")}
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
