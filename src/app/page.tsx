import { RunningHead, MarginNote } from "@/components/notebook";
import { PaneGrid } from "@/components/instrument/PaneGrid";
import { projects } from "@/data/projects";

export default function Home() {
  const active = projects.filter((p) => p.status === "producing").length;
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            {projects.length}&nbsp;panes &nbsp;·&nbsp; mmxxvi — ongoing
          </>
        }
      />

      <section className="hero">
        <div>
          <h1 className="title">
            Tools, games, and small studies —<br />
            <em>built to be understood</em>.
          </h1>
          <p className="lede">
            A session over the things I keep returning to: a file manager with
            an IDE&rsquo;s soul, a query compiler, card-game AIs, and the
            harnesses that build them. Some are finished, some never will be,
            and a few are <b>still producing new observations</b>.
          </p>
        </div>
        <MarginNote label="How to drive">
          <code>j</code>/<code>k</code> moves between panes, <code>↵</code>{" "}
          opens. <code>/</code> is the index. <code>t</code> cycles my actual
          terminal themes — these colors are generated from my dotfiles, so
          the site is dressed in the colors I work in.
        </MarginNote>
      </section>

      <PaneGrid />

      <footer className="statusline">
        <span>
          <span className="sl-k">panes</span> {projects.length} ({active}{" "}
          active)
        </span>
        <span>
          <span className="sl-k">loc</span> ~250k across the fleet
        </span>
        <span>
          <span className="sl-k">where</span> sydney
        </span>
        <span>
          <a href="https://github.com/xnmp">github/xnmp</a>
        </span>
        <span>
          <a href="mailto:chonw@proton.me">chonw@proton.me</a>
        </span>
        <span>
          <a href="https://github.com/xnmp/dotfiles">themed by my dotfiles</a>
        </span>
      </footer>
    </>
  );
}
