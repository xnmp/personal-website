import Link from "next/link";
import { RunningHead } from "@/components/notebook";
import { Cap, Key, Led, ModuleCard, RackKeys, Screen, Prop } from "@/components/rack";
import { bySlug, projects, shelves } from "@/data/projects";
import { PaletteScreen } from "@/components/launch/PaletteScreen";
import { ForOS } from "@/components/launch/ForOS";

const FLAGSHIP = "tauri-explorer";

export default function Home() {
  const flagship = bySlug.get(FLAGSHIP)!;
  const active = projects.filter((p) => p.status === "producing" || p.status === "alpha").length;
  return (
    <>
      <RackKeys />
      <RunningHead
        brand="chong"
        meta={
          `${projects.length} projects \u00a0·\u00a0 ${active} active \u00a0·\u00a0 sydney`
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="hero">
          <div className="hero-col">
            <div className="hero-copy faceplate">
              <Prop kind="pin" />
              <div className="silk">Field notes, 2026</div>
              <h1 className="title">
                Tools I use every day, <span className="soft">and agents for the games I grew up on.</span>
              </h1>
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
            {/* a style whose panels in a row are set level shows a cut of its scene here (kit.css .tier-cut) */}
            <div className="tier-cut" aria-hidden="true" />
          </div>
          {/* the flagship sheet: the product leads the page, its screen
              first, with its call to action on the first screen */}
          <section className="flagship faceplate" aria-labelledby="flagship-title">
            <Led status={flagship.status} className="sheet-pin" />
            <span className="module-top silk">
              <span className="module-num">{flagship.number} · flagship</span>
              <span className="module-status">alpha testers wanted</span>
            </span>
            <a href="/p/tauri-explorer" className="flagship-screen" data-rack-stop aria-label="Tauri Explorer details">
              <Screen tone={flagship.tone} className="pal-screen" glass>
                <PaletteScreen />
              </Screen>
            </a>
            <h2 id="flagship-title">
              {flagship.title}: <span className="soft"><ForOS>Ctrl+P for your filesystem.</ForOS></span>
            </h2>
            <p>
              A keyboard-first file manager in Rust and Svelte, with frecency
              fuzzy-find, content search, a command palette and a git graph.
              Its page runs a working copy you can try in the browser.
            </p>
            <div className="keys">
              <Key href="/p/tauri-explorer#alpha" tone="signal" size="lg" ariaLabel="Join the Tauri Explorer alpha">
                Join the alpha
              </Key>
              <Key href="/p/tauri-explorer#live" size="lg">
                Try it live
              </Key>
            </div>
            <span className="module-stats silk">
              {flagship.stats.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </span>
          </section>
        </section>

        {shelves.map((shelf) => {
          const mounted = projects.filter((p) => p.shelf === shelf.id && p.slug !== FLAGSHIP);
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
