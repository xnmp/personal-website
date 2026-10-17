import { ZsyLadder } from "@/components/charts/ZsyLadder";
import { ZsyRuns } from "@/components/charts/ZsyRuns";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/zheng-shang-you"), "metadata");
}

export default function ZsyPage() {
  const content = readContent("projects/zheng-shang-you");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="zheng-shang-you" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
            <Key href="/p/zheng-shang-you/play"><Markdown text={contentBlock(content, "play-it")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="zheng-shang-you" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "zheng-shang-you-is-a-4-player-climbing-game-shed-your-hand")} />
            <div className="launch-keys">
              <Key href="/p/zheng-shang-you/play" tone="signal" size="lg"><Markdown text={contentBlock(content, "play-the-strategist")} inline /></Key>
            </div>
          </div>
          <div>
            <Screen art="/screens/zheng-shang-you.png" tone="rust" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "pytorch")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "ppo-bc")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "league-self-play")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "rust-engine")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-dead-end")} inline /></div>
            <h2><Markdown text={contentBlock(content, "self-play-with-zero-signal")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-obvious-approach-douzero-style-deep-monte-carlo-self-p")} />
            <Markdown text={contentBlock(content, "what-replaced-it-is-a-recipe-and-each-step-is-measurable-c")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-recipe")} inline /></div>
            <h2><Markdown text={contentBlock(content, "the-recipe-one-fix-at-a-time")} inline /></h2>
            <Markdown text={contentBlock(content, "win-rate-in-a-4-player-ring-against-three-scripted-strateg")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-from-cloning-to-search")}
              caption={contentBlock(content, "caption-fig-1-every-step-is-one-dated-fix-from-the-trainin")}
            >
              <ZsyLadder />
            </Plate>
            <Markdown text={contentBlock(content, "the-search-deserves-its-own-footnote")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "generations")} inline /></div>
            <h2><Markdown text={contentBlock(content, "generations-honestly")} inline /></h2>
            <Markdown text={contentBlock(content, "training-win-rate-by-iteration-across-the-league-runs-incl")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-league-self-play-runs")}
              caption={contentBlock(content, "caption-fig-2-gen-1-reached-0-471-1-000-games-ci-0-44-0-50")}
            >
              <ZsyRuns />
            </Plate>
            <Markdown text={contentBlock(content, "each-generation-trains-against-a-mixture-of-the-frozen-pre")} paragraphStyle={{ marginTop: 20 }} />
            <Markdown text={contentBlock(content, "supporting-cast-a-pyo3-rust-engine-that-simulates-a-game-i")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown text={contentBlock(content, "gen-3-s-proxy-matchups-are-flat-against-a-same-class-ancho")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")}><Markdown text={contentBlock(content, "winning-games-average-1")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialspytorch-rust-pyo3-python")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintage2026-in-training")} inline /></div>
          <div><Markdown text={contentBlock(content, "scale-14k-loc-3-generations-0")} inline /></div>
          <div><Markdown text={contentBlock(content, "source-github-xnmp-zheng-shang-you-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="zheng-shang-you" />
    </>
  );
}
