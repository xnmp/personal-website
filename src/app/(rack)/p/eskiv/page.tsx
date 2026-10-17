import { EskivQ1 } from "@/components/charts/EskivQ1";
import { EskivQ2 } from "@/components/charts/EskivQ2";
import { EskivQ3 } from "@/components/charts/EskivQ3";
import { Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { VideoScreen } from "@/components/rack/VideoScreen";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/eskiv");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function EskivPage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="eskiv" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="eskiv" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "eskiv-is-a-2016-game-you-move-a-square-dodge-balls-grab-a")} />
          </div>
          <div>
            <Screen art="/screens/eskiv.png" tone="olive" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "python")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "pygame")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "brute-force-search")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "game-from-2016")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-game")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-you-re-watching")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-0-one-game-played-at-speed")}
              caption={contentBlock(content, "caption-a-recording-of-the-brute-force-agent-playing-on-yo")}
            >
              <VideoScreen
                id="XvFl7R0Q5kE"
                title={contentBlock(content, "window-title-1")}
                art="/screens/eskiv-run.png"
                label={contentBlock(content, "label-watch-the-run")}
              />
            </Plate>
            <Markdown text={contentBlock(content, "the-large-square-is-the-player")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-setup")} inline /></div>
            <h2><Markdown text={contentBlock(content, "10-000-games-three-questions")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-engine-was-rewritten-headless-vectorised-enemies-no-py")} />
            <ol>
              <li><Markdown text={contentBlock(content, "does-the-agent-move-in-straight-lines")} inline /></li>
              <li><Markdown text={contentBlock(content, "where-does-it-spend-its-time")} inline /></li>
              <li><Markdown text={contentBlock(content, "how-does-it-die")} inline /></li>
            </ol>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "path-ratio")} inline /></div>
            <h2><Markdown text={contentBlock(content, "path-ratio-vs-clutter")} inline /></h2>
            <Markdown text={contentBlock(content, "straight-line-distance-divided-by-actual-path-walked-per-p")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-742-146-pickups-across-10-000-games")}
              caption={contentBlock(content, "caption-mean-ratio-line-interquartile-range-band-sample-co")}
            >
              <EskivQ1 />
            </Plate>
            <Markdown text={contentBlock(content, "with-an-empty-field-the-agent-walks-at-76-of-the-straight")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown text={contentBlock(content, "where-the-agent-stands")} inline /></h2>
            <Markdown text={contentBlock(content, "player-position-density-by-score-bucket")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-12-score-buckets-smoothed-density")}
              caption={contentBlock(content, "caption-top-left-is-the-top-left-corner-of-the-game-field")}
            >
              <EskivQ2 />
            </Plate>
            <Markdown text={contentBlock(content, "up-to-about-200-points-the-agent-hugs-the-centre-which-giv")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "how-it-dies")} inline /></div>
            <h2><Markdown text={contentBlock(content, "how-it-dies-2")} inline /></h2>
            <Markdown text={contentBlock(content, "final-score-per-game")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-3-10-000-games-mean-381-1-median-385")}
              caption={contentBlock(content, "caption-every-death-was-by-trap-zero-deaths-by-direct-hit")}
            >
              <EskivQ3 />
            </Plate>
            <Markdown text={contentBlock(content, "the-distribution-is-tight-stddev-58-p10-p90-range-of-310-4")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown text={contentBlock(content, "if-the-agent-never-gets-hit-it-s-over-spending-its-lookahe")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")}><Markdown text={contentBlock(content, "the-corner-stickiness-in-late-game-emerges-without-being-d")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-iii")}><Markdown text={contentBlock(content, "the-path-ratio-curve-bends-smoothly-through-20-balls")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialspython-numpy-scipy-pygame")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintage2016-analysis-2026")} inline /></div>
          <div><Markdown text={contentBlock(content, "scale10-000-games-16")} inline /></div>
          <div><Markdown text={contentBlock(content, "source-github-xnmp-eskiv-new-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="eskiv" />
    </>
  );
}
