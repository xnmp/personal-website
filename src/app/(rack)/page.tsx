import Link from "next/link";
import { Cap, Key, ModuleCard, RackKeys, Prop } from "@/components/rack";
import { Masthead } from "@/components/landing/Masthead";
import { ExplorerWindow } from "@/components/landing/ExplorerWindow";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";
import { FEATURED, FLAGSHIP, bySlug, projects, shelves } from "@/data/projects";

export default function Home() {
  const flagship = bySlug.get(FLAGSHIP)!;
  const featured = FEATURED.map((slug) => bySlug.get(slug)!);
  const onFirstScreen = new Set([FLAGSHIP, ...FEATURED]);
  return (
    <>
      <RackKeys />
      <Masthead brand="chong" tagline="tools, games, and the agents that play them" />
      <main id="content" className="rack-main" tabIndex={-1}>
        {/* the first screen, composed as the style's mock (globals.css: home landing) */}
        <div className="landing">
          <section className="launchpad" aria-labelledby="flagship-title">
            <div className="launchpad-copy">
              <h2 id="flagship-title" className="launchpad-title">
                {flagship.title}
              </h2>
              <p className="launchpad-pitch">A keyboard-first file manager.</p>
              <p className="launchpad-call">Alpha testers wanted.</p>
              <div className="keys launchpad-keys">
                <Key href="/p/tauri-explorer#alpha" tone="signal" size="lg" ariaLabel="Join the Tauri Explorer alpha">
                  Join the alpha <span className="key-arrow" aria-hidden>{"\u2192"}</span>
                </Key>
                <Key href="/p/tauri-explorer#live" size="lg">
                  Try it live
                </Key>
              </div>
            </div>
            <a href="/p/tauri-explorer" className="launchpad-window" data-rack-stop aria-label="Tauri Explorer details">
              <ExplorerWindow />
            </a>
          </section>
          <section className="showcase" aria-labelledby="showcase-title">
            <h2 id="showcase-title" className="showcase-title">
              Projects
            </h2>
            <ul className="showcase-row">
              {featured.map((p) => (
                <li key={p.slug}>
                  <ShowcaseCard p={p} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="hero-copy faceplate intro">
          <Prop kind="pin" />
          <div className="silk">Field notes, 2026</div>
          <h2 className="title">
            Tools I use every day, <span className="soft">and agents for the games I grew up on.</span>
          </h2>
          <p className="lede">
            A file manager, a markdown editor, a mood diary and the bar at the
            top of my screen. Next to them are agents learning Brood War, Magic
            and our family card game. Each sheet is one project, with the
            numbers I’ve measured and <b>the parts that didn’t work</b>.
          </p>
          <p className="hero-more">
            <Link href="/about" className="text-action">More about me</Link>
          </p>
        </div>

        {shelves.map((shelf) => {
          const mounted = projects.filter((p) => p.shelf === shelf.id && !onFirstScreen.has(p.slug));
          return (
            <div key={shelf.id} className="shelf-group">
              {/* a 1U blanking panel, silkscreened with the shelf's name */}
              <div className="divider faceplate">
                <h2 className="shelf-label">
                  {shelf.label}{" "}
                  <span className="shelf-note">{shelf.note}</span>
                </h2>
                <span className="shelf-count">{mounted.length} projects</span>
              </div>
              <div className="shelf">
                {mounted.map((p) => (
                  <ModuleCard key={p.slug} p={p} />
                ))}
              </div>
            </div>
          );
        })}

      </main>
      <footer className="statusline">
        {/* each key with what it does, unbroken, its separator trailing it (the
            spaces explicit: one before an entity on its line is dropped) */}
        <span className="sl-keys fine-only">
          <span>
            <Cap inline>j</Cap>{" "}<Cap inline>k</Cap>{" "}projects&nbsp;&nbsp;·
          </span>{" "}
          <span>
            <Cap inline>↵</Cap>{" "}open&nbsp;&nbsp;·
          </span>{" "}
          <span>
            <Cap inline>/</Cap>{" "}search&nbsp;&nbsp;·
          </span>{" "}
          <span>
            <Cap inline>t</Cap>{" "}theme
          </span>
        </span>
        <span>
          <Link href="/about">about me</Link>
        </span>
        <span>
          <a href="https://github.com/xnmp">github/xnmp</a>
        </span>
        <span>
          <a href="mailto:chonw@proton.me">chonw@proton.me</a>
        </span>
        <span>
          screens themed by <a href="https://github.com/xnmp/dotfiles">my dotfiles</a>
        </span>
        <span>art generated &amp; composited for this site</span>
      </footer>
    </>
  );
}
