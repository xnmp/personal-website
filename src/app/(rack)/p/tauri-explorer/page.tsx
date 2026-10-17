import { EditableText } from "@/components/studio/EditableText";
import { bindBlock, bindField, type ContentBinding } from "@/lib/studio/bindings";
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
  const COUNTS = projects.find((p) => p.slug === "tauri-explorer")!.stats
    .map((text, index) => ({ text, index }))
    .filter(({ text }) => !text.startsWith("v"));
  /** What a tester can check before writing in, next to the call to action.
   * `more` is dropped on phones, where the first three facts share one line. */
  type ProofFact = {
    text: string;
    more?: string;
    textBinding?: ContentBinding;
    moreBinding?: ContentBinding;
  };
  const PROOF = contentField<(ProofFact | { includeStats: true })[]>(content, "proof")
    .flatMap<ProofFact>((fact, index) => "includeStats" in fact
      ? COUNTS.map(({ text, index: statIndex }) => ({ text, textBinding: bindField(content, ["stats", statIndex]) }))
      : [{ ...fact, textBinding: bindField(content, ["proof", index, "text"]), moreBinding: fact.more === undefined ? undefined : bindField(content, ["proof", index, "more"]) }]);
  /** Where screenshots swap to their phone crops. */
  const PHONE = "(max-width: 600px)";

  /** Real bindings, from src/lib/state/commands/* in the app repo. */
  const REFLEXES: { chord: string[]; what: string }[] = contentField<{ chord: string[]; what: string }[]>(content, "reflexes");

  /** Feature crops at native resolution (w, h in 2x px), each shown at the app's
   * real size; tighter ones on phones so the text stays legible; the full window
   * is one click away. */
  const SHOTS: Shot[] = contentField<Shot[]>(content, "shots").map((shot, index) => ({
    ...shot,
    labelBinding: bindField(content, ["shots", index, "label"]),
    noteBinding: bindField(content, ["shots", index, "note"]),
  }));

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="tauri-explorer" />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline /></Key>
            <Key href={REPO}><Markdown {...bindBlock(content, "github")} inline /></Key>
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
              <span className="seplist"><Markdown {...bindBlock(content, "spantauri-explorer-version-spanalpha-testers-wanted")} inline /></span>
            </div>
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "a-keyboard-first-file-manager-for-linux-macos-and-windows")} paragraphClassName="launch-sub" />
            <Markdown {...bindBlock(content, "fuzzy-find-any-file-search-inside-all-of-them-and-run-ever")} paragraphClassName="launch-lede" />
            <div className="launch-keys">
              <Key href={INVITE} tone="signal" size="lg"><Markdown {...bindBlock(content, "join-the-alpha")} inline /></Key>
              <Key href={`#${DEMO_ANCHOR}`} size="lg"><Markdown {...bindBlock(content, "try-it-live")} inline /></Key>
            </div>
            <p className="launch-keys-note note">
              <span><Markdown {...bindBlock(content, "opens-an-email-to-email")} inline /></span>
              <CopyKey text={EMAIL} variant="text" />
              <a href="#alpha" className="text-action keys-note-terms"><Markdown {...bindBlock(content, "what-testers-get")} inline /></a>
            </p>
            <ul className="launch-proof seplist silk" aria-label="At a glance">
              {PROOF.map((p) => (
                <li key={p.text}>
                  <EditableText binding={p.textBinding}>{p.text}</EditableText>
                  {p.more ? <span className="proof-more"><EditableText binding={p.moreBinding}>{p.more}</EditableText></span> : null}
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
                <span className="fine-only"><Markdown {...bindBlock(content, "press-these-keys-to-jump-to-the-live-demo-and-hand-it-the")} inline /></span>
                <span className="coarse-only"><Markdown {...bindBlock(content, "quick-open-typing-read")} inline /></span>
              </figcaption>
            </figure>
            {/* a style whose panels in a row are set level shows a cut of its scene here (kit.css .tier-cut) */}
            <div className="tier-cut" aria-hidden="true" />
          </div>
        </section>

        <LiveSection />

        <section className="section stack sheet-narrow sheet-start pin-left">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-reflexes")} inline /></div>
            <h2><Markdown {...bindBlock(content, "shortcuts-your-editor-already-taught-you")} inline /></h2>
            <Markdown {...bindBlock(content, "these-are-the-default-bindings")} paragraphClassName="aside-note" />
          </div>
          <ul className="reflexes">
            {REFLEXES.map((r, index) => (
              <li key={r.chord.join("+")}>
                <LiveCaps chord={r.chord} />
                <span>
                  <EditableText binding={bindField(content, ["reflexes", index, "what"])} shortcuts><ForOS>{r.what}</ForOS></EditableText>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section stack sheet-narrow sheet-end sheet-flat pin-right">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "why-another-file-manager")} inline /></div>
            <h2><Markdown {...bindBlock(content, "most-of-them-are-polished-but-slow-or-fast-but-punishing")} inline /></h2>
          </div>
          <div className="prose-cols">
            <Markdown {...bindBlock(content, "finder-and-explorer-are-polished-but-every-trip-through-th")} />
            <Markdown {...bindBlock(content, "quick-open-walks-the-tree-with-jwalk-and-ranks-matches-wit")} />
            <Markdown {...bindBlock(content, "everything-else-including-sidebars-columns-previews-and-th")} />
          </div>
        </section>

        {/* the screenshots, each a print on its own sheet */}
        <section className="shots" aria-label="Screenshots">
          <ShotGallery shots={SHOTS} phoneMedia={PHONE} />
        </section>

        <section className="section sheet-wide sheet-start sheet-flat pin-left">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "under-the-hood")} inline /></div>
            <h2><Markdown {...bindBlock(content, "one-person-tested-like-a-team")} inline /></h2>
            <Markdown {...bindBlock(content, "counts-are-from-the-repository-on-6-oct-2026")} paragraphClassName="aside-note" />
          </div>
          {/* printed on the sheet, like a spec table: mats are for screens */}
          <dl className="ledger">
            {contentField<string[][]>(content, "ledger").map(([n, l], index) => (
              <div key={l} className="ledger-row">
                <dt className="ledger-l"><EditableText binding={bindField(content, ["ledger", index, 1])}>{l}</EditableText></dt>
                <dd className="ledger-n"><EditableText binding={bindField(content, ["ledger", index, 0])}>{n}</EditableText></dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section stack sheet-wide sheet-end pin-right">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "also-in-the-box")} inline /></div>
            <h2><Markdown {...bindBlock(content, "things-you-won-t-find-in-the-screenshots")} inline /></h2>
          </div>
          <div className="features">
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "replaces-your-file-picker")} inline /></h3>
              <Markdown {...bindBlock(content, "on-linux-it-can-act-as-the-xdg-desktop-portal-file-chooser")} />
            </div>
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "twelve-themes-plus-yours")} inline /></h3>
              <Markdown {...bindBlock(content, "drop-a")} />
            </div>
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "splits-and-miller-columns")} inline /></h3>
              <Markdown {...bindBlock(content, "tabs-dual-pane-arbitrary-splits-named-workspaces-and-a-yaz")} />
            </div>
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "careful-file-ops")} inline /></h3>
              <Markdown {...bindBlock(content, "undo-trash-with-restore-a-conflict-resolver")} />
            </div>
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "plugins")} inline /></h3>
              <Markdown {...bindBlock(content, "ai-rename-ai-organize-and-image-tools-ship-as-plugins-you")} />
            </div>
            <div className="feat">
              <h3><Markdown {...bindBlock(content, "no-telemetry")} inline /></h3>
              <Markdown {...bindBlock(content, "nothing-phones-home")} />
            </div>
          </div>
        </section>

        {/* the page's end point: the one sheet wider than the column, on the
            signal pin */}
        <section className="section alpha" id="alpha">
          <div>
            {/* the sheet hangs on the signal pin; the kicker needs no lamp of its own */}
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-alpha")} inline /></div>
            <h2><Markdown {...bindBlock(content, "looking-for-a-small-first-cohort-of-people-who-live-in-a-f")} inline /></h2>
            <div className="alpha-keys">
              <Key href={INVITE} tone="signal" size="lg"><Markdown {...bindBlock(content, "join-the-alpha-2")} inline /></Key>
              <DownloadKey repo={REPO} version={VERSION} />
            </div>
          </div>
          <div>
            <Markdown {...bindBlock(content, "testers-get-a-direct-line-to-me")} paragraphClassName="alpha-lead" />
            <Markdown {...bindBlock(content, "to-join-write-with-your-os-desktop-environment-and-display")} />
            <p className="alpha-alt">
              <span><Markdown {...bindBlock(content, "no-mail-app")} inline /></span>
              <CopyKey text={EMAIL} variant="text" />
            </p>
            <Markdown {...bindBlock(content, "rather-try-it-first")} />
            <Markdown {...bindBlock(content, "before-you-say-yes-here-s-what-it-s-like-today")} />
            <ul>
              <li><Markdown {...bindBlock(content, "builds-are-unsigned")} inline /></li>
              <li><Markdown {...bindBlock(content, "no-auto-updater-yet")} inline /></li>
              <li><Markdown {...bindBlock(content, "start-on-a-scratch-folder")} inline /></li>
              <li><Markdown {...bindBlock(content, "reporting-is-built-in")} inline /></li>
            </ul>
          </div>
        </section>

        {/* install and the spec plate lie side by side, at two depths */}
        <div className="sheet-row">
          <section className="section" id="install">
            <div>
              <div className="section-kicker"><Markdown {...bindBlock(content, "install")} inline /></div>
              <h2><Markdown {...bindBlock(content, "install-version")} inline /></h2>
              <Markdown {...bindBlock(content, "linux-appimage")} paragraphClassName="aside-note" />
            </div>
            <div className="install">
              <div className="install-keys">
                <DownloadKey repo={REPO} version={VERSION} others />
              </div>
              <div className="install-nix">
                <span className="silk"><Markdown {...bindBlock(content, "or-with-nix")} inline /></span>
                {/* typed on a strip of tape, like any label; on a narrow screen
                    the command wraps after its scheme, never mid-word */}
                <div className="cmd tape"><Markdown {...bindBlock(content, "code-nix-scheme-breakspan-nix-repo-class-nowrap-class-cmd")} inline /></div>
                <CopyKey text={NIX} variant="text" />
              </div>
            </div>
          </section>

          <section className="colophon">
            <div><Markdown {...bindBlock(content, "materialsrust-tauri-v2-svelte-5")} inline /></div>
            <div><Markdown {...bindBlock(content, "platformslinux-macos-windows")} inline /></div>
            <div><Markdown {...bindBlock(content, "licencemit")} inline /></div>
            <div><Markdown {...bindBlock(content, "source-linkgithub-xnmp-tauri-explorer-href-https-github")} inline /></div>
          </section>
        </div>

      </main>
      <Folio slug="tauri-explorer" />
    </>
  );
}
