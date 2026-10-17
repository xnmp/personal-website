import { CopyKey } from "@/components/launch/CopyKey";
import { DownloadKey } from "@/components/launch/DownloadKey";
import { ForOS } from "@/components/launch/ForOS";
import { LiveCaps } from "@/components/launch/LiveCaps";
import { LiveSection } from "@/components/launch/LiveDemo";
import { ShotGallery, type Shot } from "@/components/launch/ShotGallery";
import { APP_THEME } from "@/components/launch/appTheme";
import { DEMO_ANCHOR } from "@/components/launch/keyboard";
import { Folio, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Led, Prop, Screen } from "@/components/rack";
import { readProjectCatalog } from "@/data/projects";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/tauri-explorer"), "metadata");
}

export default function TauriExplorerPage() {
  const { projects } = readProjectCatalog();
  const content = readContent("projects/tauri-explorer");

  const REPO = contentField<string>(content, "repo");
  const VERSION = contentField<string>(content, "version");
  const EMAIL = contentField<string>(content, "email");
  const INVITE =
    `mailto:${EMAIL}?subject=Tauri%20Explorer%20alpha&body=` +
    encodeURIComponent(
      "OS + version:\nDesktop environment (Linux):\nDisplay scale:\nWhat file manager do you use today?\n"
    );
  const NIX_SCHEME = contentField<string>(content, "nix_scheme");
  const NIX_REPO = contentField<string>(content, "nix_repo");
  const NIX = NIX_SCHEME + NIX_REPO;
  /** The same counts the home rack prints on this module (minus the version,
   * which the kicker already shows). */
  const COUNTS = projects.find((p) => p.slug === "tauri-explorer")!.stats.filter((s) => !s.startsWith("v"));
  /** What a tester can check before writing in, next to the call to action.
   * `more` is dropped on phones, where the first three facts share one line. */
  type ProofFact = { text: string; more?: string };
  const PROOF = contentField<(ProofFact | { includeStats: true })[]>(content, "proof")
    .flatMap<ProofFact>(fact => "includeStats" in fact ? COUNTS.map(text => ({ text })) : [fact]);
  /** Where screenshots swap to their phone crops. */
  const PHONE = "(max-width: 600px)";

  /** Real bindings, from src/lib/state/commands/* in the app repo. */
  const REFLEXES: { chord: string[]; what: string }[] = contentField<{ chord: string[]; what: string }[]>(content, "reflexes");

  /** Feature crops at native resolution (w, h in 2x px), each shown at the app's
   * real size; tighter ones on phones so the text stays legible; the full window
   * is one click away. */
  const SHOTS: Shot[] = contentField<Shot[]>(content, "shots");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="tauri-explorer" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
            <Key href={REPO}><Markdown text={contentBlock(content, "github")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        {/* two sheets: the promise, and the product pinned beside it */}
        <section className="launch-hero">
          <div className="launch-copy faceplate">
            <Prop kind="pin" />
            <div className="kicker launch-kicker">
              <Led color="signal" blink />
              <span className="seplist"><Markdown text={contentBlock(content, "spantauri-explorer-version-spanalpha-testers-wanted")} inline /></span>
            </div>
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "a-keyboard-first-file-manager-for-linux-macos-and-windows")} paragraphClassName="launch-sub" />
            <Markdown text={contentBlock(content, "fuzzy-find-any-file-search-inside-all-of-them-and-run-ever")} paragraphClassName="launch-lede" />
            <div className="launch-keys">
              <Key href={INVITE} tone="signal" size="lg"><Markdown text={contentBlock(content, "join-the-alpha")} inline /></Key>
              <Key href={`#${DEMO_ANCHOR}`} size="lg"><Markdown text={contentBlock(content, "try-it-live")} inline /></Key>
            </div>
            <p className="launch-keys-note note">
              <span><Markdown text={contentBlock(content, "opens-an-email-to-email")} inline /></span>
              <CopyKey text={EMAIL} variant="text" />
              <a href="#alpha" className="text-action keys-note-terms"><Markdown text={contentBlock(content, "what-testers-get")} inline /></a>
            </p>
            <ul className="launch-proof seplist silk" aria-label="At a glance">
              {PROOF.map((p) => (
                <li key={p.text}>
                  {p.text}
                  {p.more ? <span className="proof-more">{p.more}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="launch-col">
            <figure className="launch-shot faceplate">
              <Prop kind="pin" />
              <Screen>
                {/* the app window with quick open over it (2x pixels), and
                    on phones a strip of the palette's input and first rows at
                    about real size, short enough to share the first screen
                    with the alpha key; the app itself is one scroll away,
                    running live. One capture per rice, in the app's own theme
                    nearest it (appTheme.ts); only the current rice's is shown,
                    so only it loads. */}
                {Object.entries(APP_THEME).map(([rice, theme]) => (
                  <picture key={rice} data-rice-shot={rice}>
                    <source media={PHONE} srcSet={`/tauri/hero-quick-open-strip-${theme}.webp`} width={406} height={162} />
                    <img
                      src={`/tauri/hero-quick-open-${theme}.webp`}
                      alt={contentBlock(content, "alt-tauri-explorer-s-window-with-quick-open-over-it-after")}
                      width={698}
                      height={438}
                      loading="lazy"
                      fetchPriority="high"
                      className="shot-img"
                    />
                  </picture>
                ))}
              </Screen>
              <figcaption className="launch-shot-cap note">
                <LiveCaps chord={["Ctrl", "P"]} className="fine-only" />
                <span className="fine-only"><Markdown text={contentBlock(content, "press-these-keys-to-jump-to-the-live-demo-and-hand-it-the")} inline /></span>
                <span className="coarse-only"><Markdown text={contentBlock(content, "quick-open-typing-read")} inline /></span>
              </figcaption>
            </figure>
            {/* a style whose panels in a row are set level shows a cut of its scene here (kit.css .tier-cut) */}
            <div className="tier-cut" aria-hidden="true" />
          </div>
        </section>

        <LiveSection />

        <section className="section stack sheet-narrow sheet-start pin-left">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-reflexes")} inline /></div>
            <h2><Markdown text={contentBlock(content, "shortcuts-your-editor-already-taught-you")} inline /></h2>
            <Markdown text={contentBlock(content, "these-are-the-default-bindings")} paragraphClassName="aside-note" />
          </div>
          <ul className="reflexes">
            {REFLEXES.map((r) => (
              <li key={r.chord.join("+")}>
                <LiveCaps chord={r.chord} />
                <span>
                  <ForOS>{r.what}</ForOS>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section stack sheet-narrow sheet-end sheet-flat pin-right">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "why-another-file-manager")} inline /></div>
            <h2><Markdown text={contentBlock(content, "most-of-them-are-polished-but-slow-or-fast-but-punishing")} inline /></h2>
          </div>
          <div className="prose-cols">
            <Markdown text={contentBlock(content, "finder-and-explorer-are-polished-but-every-trip-through-th")} />
            <Markdown text={contentBlock(content, "quick-open-walks-the-tree-with-jwalk-and-ranks-matches-wit")} />
            <Markdown text={contentBlock(content, "everything-else-including-sidebars-columns-previews-and-th")} />
          </div>
        </section>

        {/* the screenshots, each a print on its own sheet */}
        <section className="shots" aria-label="Screenshots">
          <ShotGallery shots={SHOTS} phoneMedia={PHONE} />
        </section>

        <section className="section sheet-wide sheet-start sheet-flat pin-left">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "under-the-hood")} inline /></div>
            <h2><Markdown text={contentBlock(content, "one-person-tested-like-a-team")} inline /></h2>
            <Markdown text={contentBlock(content, "counts-are-from-the-repository-on-6-oct-2026")} paragraphClassName="aside-note" />
          </div>
          {/* printed on the sheet, like a spec table: mats are for screens */}
          <dl className="ledger">
            {contentField<string[][]>(content, "ledger").map(([n, l]) => (
              <div key={l} className="ledger-row">
                <dt className="ledger-l">{l}</dt>
                <dd className="ledger-n">{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section stack sheet-wide sheet-end pin-right">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "also-in-the-box")} inline /></div>
            <h2><Markdown text={contentBlock(content, "things-you-won-t-find-in-the-screenshots")} inline /></h2>
          </div>
          <div className="features">
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "replaces-your-file-picker")} inline /></h3>
              <Markdown text={contentBlock(content, "on-linux-it-can-act-as-the-xdg-desktop-portal-file-chooser")} />
            </div>
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "twelve-themes-plus-yours")} inline /></h3>
              <Markdown text={contentBlock(content, "drop-a")} />
            </div>
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "splits-and-miller-columns")} inline /></h3>
              <Markdown text={contentBlock(content, "tabs-dual-pane-arbitrary-splits-named-workspaces-and-a-yaz")} />
            </div>
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "careful-file-ops")} inline /></h3>
              <Markdown text={contentBlock(content, "undo-trash-with-restore-a-conflict-resolver")} />
            </div>
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "plugins")} inline /></h3>
              <Markdown text={contentBlock(content, "ai-rename-ai-organize-and-image-tools-ship-as-plugins-you")} />
            </div>
            <div className="feat">
              <h3><Markdown text={contentBlock(content, "no-telemetry")} inline /></h3>
              <Markdown text={contentBlock(content, "nothing-phones-home")} />
            </div>
          </div>
        </section>

        {/* the page's end point: the one sheet wider than the column, on the
            signal pin */}
        <section className="section alpha" id="alpha">
          <div>
            {/* the sheet hangs on the signal pin; the kicker needs no lamp of its own */}
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-alpha")} inline /></div>
            <h2><Markdown text={contentBlock(content, "looking-for-a-small-first-cohort-of-people-who-live-in-a-f")} inline /></h2>
            <div className="alpha-keys">
              <Key href={INVITE} tone="signal" size="lg"><Markdown text={contentBlock(content, "join-the-alpha-2")} inline /></Key>
              <DownloadKey repo={REPO} version={VERSION} />
            </div>
          </div>
          <div>
            <Markdown text={contentBlock(content, "testers-get-a-direct-line-to-me")} paragraphClassName="alpha-lead" />
            <Markdown text={contentBlock(content, "to-join-write-with-your-os-desktop-environment-and-display")} />
            <p className="alpha-alt">
              <span><Markdown text={contentBlock(content, "no-mail-app")} inline /></span>
              <CopyKey text={EMAIL} variant="text" />
            </p>
            <Markdown text={contentBlock(content, "rather-try-it-first")} />
            <Markdown text={contentBlock(content, "before-you-say-yes-here-s-what-it-s-like-today")} />
            <ul>
              <li><Markdown text={contentBlock(content, "builds-are-unsigned")} inline /></li>
              <li><Markdown text={contentBlock(content, "no-auto-updater-yet")} inline /></li>
              <li><Markdown text={contentBlock(content, "start-on-a-scratch-folder")} inline /></li>
              <li><Markdown text={contentBlock(content, "reporting-is-built-in")} inline /></li>
            </ul>
          </div>
        </section>

        {/* install and the spec plate lie side by side, at two depths */}
        <div className="sheet-row">
          <section className="section" id="install">
            <div>
              <div className="section-kicker"><Markdown text={contentBlock(content, "install")} inline /></div>
              <h2><Markdown text={contentBlock(content, "install-version")} inline /></h2>
              <Markdown text={contentBlock(content, "linux-appimage")} paragraphClassName="aside-note" />
            </div>
            <div className="install">
              <div className="install-keys">
                <DownloadKey repo={REPO} version={VERSION} others />
              </div>
              <div className="install-nix">
                <span className="silk"><Markdown text={contentBlock(content, "or-with-nix")} inline /></span>
                {/* typed on a strip of tape, like any label; on a narrow screen
                    the command wraps after its scheme, never mid-word */}
                <div className="cmd tape"><Markdown text={contentBlock(content, "code-nix-scheme-breakspan-nix-repo-class-nowrap-class-cmd")} inline /></div>
                <CopyKey text={NIX} variant="text" />
              </div>
            </div>
          </section>

          <section className="colophon">
            <div><Markdown text={contentBlock(content, "materialsrust-tauri-v2-svelte-5")} inline /></div>
            <div><Markdown text={contentBlock(content, "platformslinux-macos-windows")} inline /></div>
            <div><Markdown text={contentBlock(content, "licencemit")} inline /></div>
            <div><Markdown text={contentBlock(content, "source-linkgithub-xnmp-tauri-explorer-href-https-github")} inline /></div>
          </section>
        </div>

      </main>
      <Folio slug="tauri-explorer" />
    </>
  );
}
