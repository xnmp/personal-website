import { bindBlock } from "@/lib/studio/bindings";
import { EskivQ1 } from "@/components/charts/EskivQ1";
import { EskivQ2 } from "@/components/charts/EskivQ2";
import { EskivQ3 } from "@/components/charts/EskivQ3";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { VideoScreen } from "@/components/rack/VideoScreen";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/eskiv"), "metadata");
}

export default function EskivPage() {
  const content = readContent("projects/eskiv");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="eskiv" />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="eskiv" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "eskiv-is-a-2016-game-you-move-a-square-dodge-balls-grab-a")} />
          </div>
          <div>
            <Screen art="/screens/eskiv.png" tone="olive" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "python")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "pygame")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "brute-force-search")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "game-from-2016")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-game")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-you-re-watching")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-0-one-game-played-at-speed")} figureBinding={bindBlock(content, "figure-fig-0-one-game-played-at-speed").binding}
              caption={contentBlock(content, "caption-a-recording-of-the-brute-force-agent-playing-on-yo")} captionBinding={bindBlock(content, "caption-a-recording-of-the-brute-force-agent-playing-on-yo").binding}
            >
              <VideoScreen
                id="XvFl7R0Q5kE"
                title={contentBlock(content, "window-title-1")}
                art="/screens/eskiv-run.png"
                label={contentBlock(content, "label-watch-the-run")} labelBinding={bindBlock(content, "label-watch-the-run").binding}
              />
            </Plate>
            <Markdown {...bindBlock(content, "the-large-square-is-the-player")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-setup")} inline /></div>
            <h2><Markdown {...bindBlock(content, "10-000-games-three-questions")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "the-engine-was-rewritten-headless-vectorised-enemies-no-py")} />
            <ol>
              <li><Markdown {...bindBlock(content, "does-the-agent-move-in-straight-lines")} inline /></li>
              <li><Markdown {...bindBlock(content, "where-does-it-spend-its-time")} inline /></li>
              <li><Markdown {...bindBlock(content, "how-does-it-die")} inline /></li>
            </ol>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "path-ratio")} inline /></div>
            <h2><Markdown {...bindBlock(content, "path-ratio-vs-clutter")} inline /></h2>
            <Markdown {...bindBlock(content, "straight-line-distance-divided-by-actual-path-walked-per-p")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-742-146-pickups-across-10-000-games")} figureBinding={bindBlock(content, "figure-fig-1-742-146-pickups-across-10-000-games").binding}
              caption={contentBlock(content, "caption-mean-ratio-line-interquartile-range-band-sample-co")} captionBinding={bindBlock(content, "caption-mean-ratio-line-interquartile-range-band-sample-co").binding}
            >
              <EskivQ1 />
            </Plate>
            <Markdown {...bindBlock(content, "with-an-empty-field-the-agent-walks-at-76-of-the-straight")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown {...bindBlock(content, "where-the-agent-stands")} inline /></h2>
            <Markdown {...bindBlock(content, "player-position-density-by-score-bucket")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-12-score-buckets-smoothed-density")} figureBinding={bindBlock(content, "figure-fig-2-12-score-buckets-smoothed-density").binding}
              caption={contentBlock(content, "caption-top-left-is-the-top-left-corner-of-the-game-field")} captionBinding={bindBlock(content, "caption-top-left-is-the-top-left-corner-of-the-game-field").binding}
            >
              <EskivQ2 />
            </Plate>
            <Markdown {...bindBlock(content, "up-to-about-200-points-the-agent-hugs-the-centre-which-giv")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "how-it-dies")} inline /></div>
            <h2><Markdown {...bindBlock(content, "how-it-dies-2")} inline /></h2>
            <Markdown {...bindBlock(content, "final-score-per-game")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-3-10-000-games-mean-381-1-median-385")} figureBinding={bindBlock(content, "figure-fig-3-10-000-games-mean-381-1-median-385").binding}
              caption={contentBlock(content, "caption-every-death-was-by-trap-zero-deaths-by-direct-hit")} captionBinding={bindBlock(content, "caption-every-death-was-by-trap-zero-deaths-by-direct-hit").binding}
            >
              <EskivQ3 />
            </Plate>
            <Markdown {...bindBlock(content, "the-distribution-is-tight-stddev-58-p10-p90-range-of-310-4")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown {...bindBlock(content, "if-the-agent-never-gets-hit-it-s-over-spending-its-lookahe")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")} labelBinding={bindBlock(content, "label-open-question-ii").binding}><Markdown {...bindBlock(content, "the-corner-stickiness-in-late-game-emerges-without-being-d")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-iii")} labelBinding={bindBlock(content, "label-open-question-iii").binding}><Markdown {...bindBlock(content, "the-path-ratio-curve-bends-smoothly-through-20-balls")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialspython-numpy-scipy-pygame")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintage2016-analysis-2026")} inline /></div>
          <div><Markdown {...bindBlock(content, "scale10-000-games-16")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-eskiv-new-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="eskiv" />
    </>
  );
}
