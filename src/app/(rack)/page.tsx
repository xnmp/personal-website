import { RunningHead } from "@/components/notebook";
import { Cap, Key, Led, ModuleCard, RackKeys, Screen } from "@/components/rack";
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
          `${projects.length} modules \u00a0·\u00a0 ${active} running \u00a0·\u00a0 sydney`
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="hero">
          <div>
            <div className="silk">Bench notes, 2026</div>
            <h1 className="title">
              Tools I use every day, <span className="soft">and agents for the games I grew up on.</span>
            </h1>
            <p className="lede">
              A file manager, a markdown editor, a mood diary and the bar at the
              top of my screen. Next to them are agents learning Brood War, Magic
              and our family card game. Each module is one project, with the
              numbers I’ve measured and <b>the parts that didn’t work</b>.
            </p>
          </div>
          <aside className="hero-aside">
            <Screen tone="olive" label="Rack status">
              <dl className="readout">
                <dt>modules</dt>
                <dd>{projects.length}</dd>
                <dt>running</dt>
                <dd>{active}</dd>
                <dt>alpha open</dt>
                <dd>{projects.filter((p) => p.status === "alpha").length}</dd>
                <dt>theme</dt>
                <dd>from my dotfiles</dd>
              </dl>
            </Screen>
            <div className="margin-note drive fine-only">
              <h2>Operate</h2>
              <dl className="operate">
                <dt>
                  <Cap>j</Cap> <Cap>k</Cap>
                </dt>
                <dd>move between modules</dd>
                <dt>
                  <Cap>↵</Cap>
                </dt>
                <dd>opens one</dd>
                <dt>
                  <Cap>/</Cap>
                </dt>
                <dd>searches</dd>
                <dt>
                  <Cap>t</Cap>
                </dt>
                <dd>switches between my terminal themes</dd>
              </dl>
            </div>
          </aside>
        </section>

        <section className="flagship faceplate" aria-labelledby="flagship-title">
          <div className="flagship-copy">
            <span className="module-top silk">
              <span className="module-num">{flagship.number} · flagship</span>
              <span className="module-status">
                <Led status={flagship.status} />
                alpha testers wanted
              </span>
            </span>
            <h2 id="flagship-title">
              {flagship.title}: <span className="soft"><ForOS>Ctrl+P for your filesystem.</ForOS></span>
            </h2>
            <p>
              A keyboard-first file manager in Rust and Svelte. It has
              frecency fuzzy-find, ripgrep content search, a command palette,
              split panes, a git graph and an embedded terminal. Its page runs a
              working copy of the app, so you can try it in the browser.
            </p>
            <div className="keys">
              <Key href="/p/tauri-explorer#alpha" tone="signal" size="lg" className="" ariaLabel="Join the Tauri Explorer alpha">
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
          </div>
          <a href="/p/tauri-explorer" className="flagship-screen" data-rack-stop aria-label="Tauri Explorer details">
            <Screen tone={flagship.tone} className="pal-screen" glass>
              <PaletteScreen />
            </Screen>
          </a>
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
                <span className="shelf-count">{mounted.length} modules</span>
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
