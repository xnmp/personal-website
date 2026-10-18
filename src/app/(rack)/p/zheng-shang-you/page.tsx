import { bindBlock } from "@/lib/studio/bindings";
import { ZsyLadder } from "@/components/charts/ZsyLadder";
import { ZsyRuns } from "@/components/charts/ZsyRuns";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
            <Key editableLabel href="/p/zheng-shang-you/play"><Markdown {...bindBlock(content, "play-it")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="zheng-shang-you" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "zheng-shang-you-is-a-4-player-climbing-game-shed-your-hand")} />
            <div className="launch-keys">
              <Key editableLabel href="/p/zheng-shang-you/play" tone="signal" size="lg"><Markdown {...bindBlock(content, "play-the-strategist")} inline allowLinks={false} /></Key>
            </div>
          </div>
          <div>
            <Screen art="/screens/zheng-shang-you.png" tone="rust" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "pytorch")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "ppo-bc")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "league-self-play")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "rust-engine")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-dead-end")} inline /></div>
            <h2><Markdown {...bindBlock(content, "self-play-with-zero-signal")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-self-play-wasnt-getting-me-very-far")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-recipe")} inline /></div>
            <h2><Markdown {...bindBlock(content, "the-recipe-one-fix-at-a-time")} inline /></h2>
            <Markdown {...bindBlock(content, "win-rate-in-a-4-player-ring-against-three-scripted-strateg")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-from-cloning-to-search")} figureBinding={bindBlock(content, "figure-fig-1-from-cloning-to-search").binding}
              caption={contentBlock(content, "caption-fig-1-every-step-is-one-dated-fix-from-the-trainin")} captionBinding={bindBlock(content, "caption-fig-1-every-step-is-one-dated-fix-from-the-trainin").binding}
            >
              <ZsyLadder />
            </Plate>
            <Markdown {...bindBlock(content, "the-search-deserves-its-own-footnote")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "generations")} inline /></div>
            <h2><Markdown {...bindBlock(content, "generations-honestly")} inline /></h2>
            <Markdown {...bindBlock(content, "training-win-rate-by-iteration-across-the-league-runs-incl")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-league-self-play-runs")} figureBinding={bindBlock(content, "figure-fig-2-league-self-play-runs").binding}
              caption={contentBlock(content, "caption-fig-2-gen-1-reached-0-471-1-000-games-ci-0-44-0-50")} captionBinding={bindBlock(content, "caption-fig-2-gen-1-reached-0-471-1-000-games-ci-0-44-0-50").binding}
            >
              <ZsyRuns />
            </Plate>
            <Markdown {...bindBlock(content, "body-training-against-earlier-versions")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-where-the-next-improvement-might-come-from")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialspytorch-rust-pyo3-python")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintage2026-in-training")} inline /></div>
          <div><Markdown {...bindBlock(content, "scale-14k-loc-3-generations-0")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-zheng-shang-you-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="zheng-shang-you" />
    </>
  );
}
