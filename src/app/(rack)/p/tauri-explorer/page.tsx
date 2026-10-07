import type { Metadata } from "next";
import Link from "next/link";
import { RunningHead } from "@/components/notebook";
import { Cap, Key, Led, Screen } from "@/components/rack";
import { CopyKey } from "@/components/launch/CopyKey";
import { DownloadKey } from "@/components/launch/DownloadKey";
import { ForOS } from "@/components/launch/ForOS";
import { LiveCaps } from "@/components/launch/LiveCaps";
import { ShotGallery, type Shot } from "@/components/launch/ShotGallery";
import { LiveSection } from "@/components/launch/LiveDemo";
import { DEMO_ANCHOR } from "@/components/launch/keyboard";
import { projects } from "@/data/projects";

const REPO = "https://github.com/xnmp/tauri-explorer";
const VERSION = "v1.11.2";
const EMAIL = "chonw@proton.me";
const INVITE =
  `mailto:${EMAIL}?subject=Tauri%20Explorer%20alpha&body=` +
  encodeURIComponent(
    "OS + version:\nDesktop environment (Linux):\nDisplay scale:\nWhat file manager do you use today?\n"
  );
const NIX = "nix run github:xnmp/tauri-explorer";
/** The same counts the home rack prints on this module (minus the version,
 * which the kicker already shows). */
const COUNTS = projects.find((p) => p.slug === "tauri-explorer")!.stats.filter((s) => !s.startsWith("v"));
/** What a tester can check before writing in, next to the call to action.
 * `more` is dropped on phones, where the first three facts share one line. */
const PROOF: { text: string; more?: string }[] = [
  { text: "MIT", more: " licensed" },
  { text: "No telemetry" },
  ...COUNTS.map((text) => ({ text })),
  { text: "Builds for Linux, macOS, Windows" },
];
/** Where screenshots swap to their phone crops. */
const PHONE = "(max-width: 600px)";

export const metadata: Metadata = {
  title: "Tauri Explorer: Ctrl+P for your filesystem",
  description:
    "A keyboard-first file manager for Linux, macOS and Windows. Frecency fuzzy-find, ripgrep content search, a command palette, split panes, git graph, embedded terminal. Alpha testers wanted.",
  openGraph: {
    title: "Tauri Explorer: Ctrl+P for your filesystem",
    description:
      "A keyboard-first file manager in Rust + Svelte. Try the working copy in your browser, then join the alpha.",
  },
};

/** Real bindings, from src/lib/state/commands/* in the app repo. */
const REFLEXES: { chord: string[]; what: string }[] = [
  { chord: ["Ctrl", "P"], what: "Quick open. Fuzzy-find any file under the tree, ranked by frecency." },
  { chord: ["Ctrl", "Shift", "F"], what: "Content search across the tree using ripgrep's own crates." },
  { chord: ["Ctrl", "Shift", "P"], what: "Command palette. Every action, rebindable." },
  { chord: ["Ctrl", "Shift", "D"], what: "Dual pane. F6 jumps sides, Ctrl+Shift+F5 copies across." },
  { chord: ["Ctrl", "T"], what: "New tab. Ctrl+Shift+T brings back the last one you closed." },
  { chord: ["Ctrl", "`"], what: "Embedded terminal, opened in the folder you’re in." },
  { chord: ["Ctrl", "Alt", "G"], what: "Git commit graph for the current repository." },
  { chord: ["Ctrl", "Z"], what: "Undo for file operations: rename, move, trash." },
];

/** Feature crops at native resolution, tighter ones on phones so the text stays
 * legible; the full window is one click away. */
const SHOTS: Shot[] = [
  { src: "/tauri/crop-content-search.webp", phone: "/tauri/crop-content-search-phone.webp", full: "/tauri/live-content-search.webp", full2x: "/tauri/live-content-search@2x.webp", w: 1320, h: 880, focus: { x: 0.25, y: 0.06 }, label: "Content search", note: "Ctrl+Shift+F searches inside files, grouped by file with the match in context." },
  { src: "/tauri/crop-command-palette.webp", phone: "/tauri/crop-command-palette-phone.webp", full: "/tauri/live-command-palette.webp", full2x: "/tauri/live-command-palette@2x.webp", w: 1320, h: 880, focus: { x: 0.25, y: 0.06 }, label: "Command palette", note: "Every command, with its shortcut. Here: switching theme without a settings page." },
  { src: "/tauri/crop-git-graph.webp", phone: "/tauri/crop-git-graph-phone.webp", full: "/tauri/live-git-graph.webp", full2x: "/tauri/live-git-graph@2x.webp", w: 1740, h: 436, focus: { x: 0.155, y: 0.5 }, label: "Git graph", note: "The commit graph sits beside your files, so you don’t have to leave for a git GUI." },
];

export default function TauriExplorerPage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            01 &nbsp;·&nbsp; Tauri Explorer &nbsp;·&nbsp; <span className="filed">alpha open</span>
          </>
        }
        nav={
          <>
            <Link href="/">← the rack</Link>
            <a href={REPO}>source on github →</a>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="launch-hero faceplate">
          <div className="launch-copy">
            <div className="kicker launch-kicker">
              <Led color="signal" blink />
              <span className="seplist">
                <span>Tauri Explorer {VERSION}</span>
                <span>alpha testers wanted</span>
              </span>
            </div>
            <h1>
              <ForOS>Ctrl+P for your filesystem.</ForOS>
            </h1>
            <p className="launch-sub">A keyboard-first file manager for Linux, macOS and Windows.</p>
            <p className="launch-lede">
              Fuzzy-find any file, search inside all of them, and run every action
              from a palette. Your hands stay on the keyboard the whole time.
            </p>
            <div className="launch-keys">
              <Key href={INVITE} tone="signal" size="lg">
                Join the alpha
              </Key>
              <Key href={`#${DEMO_ANCHOR}`} size="lg">
                Try it live
              </Key>
            </div>
            <p className="launch-keys-note note">
              <span>
                Opens an email to <b>{EMAIL}</b>
              </span>
              <CopyKey text={EMAIL} />
              <a href="#alpha" className="keys-note-terms">
                What testers get ↓
              </a>
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
          <figure className="launch-shot">
            <Screen>
              {/* the palette at about its real size (2x pixels), and on phones a
                  strip of its input and first rows at a legible size, short
                  enough to share the first screen with the alpha key; the full
                  window is one scroll away, running live */}
              <picture>
                <source media={PHONE} srcSet="/tauri/hero-quick-open-strip.webp" width={600} height={250} />
                <img
                  src="/tauri/hero-quick-open-2x.webp"
                  alt="Tauri Explorer's quick open after typing “read”: README.md ranked first, then the feature docs, each with the matched letters underlined"
                  width={1224}
                  height={816}
                  fetchPriority="high"
                  className="shot-img"
                />
              </picture>
            </Screen>
            <figcaption className="launch-shot-cap note">
              <LiveCaps chord={["Ctrl", "P"]} className="fine-only" />
              <span className="fine-only">Press these keys to jump to the live demo and hand it the keyboard.</span>
              <span className="coarse-only">Quick open, typing “read”.</span>
            </figcaption>
          </figure>
        </section>

        <LiveSection />

        <section className="section">
          <div>
            <div className="section-kicker">The reflexes</div>
            <h2>Shortcuts your editor already taught you</h2>
            <p className="aside-note">
              These are the default bindings. All of them can be rebound, and
              chords like <code>g&nbsp;h</code> (go home) work too.
            </p>
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

        <section className="section">
          <div>
            <div className="section-kicker">Why another file manager</div>
            <h2>Most of them are polished but slow, or fast but punishing</h2>
          </div>
          <div>
            <p>
              Finder and Explorer are polished, but every trip through them goes
              through the mouse. Ranger, <code>lf</code> and Midnight Commander are fast, but
              you have to learn a new set of keys first. My IDE already solved
              keyboard navigation, so this borrows its answers.
            </p>
            <p>
              Quick open walks the tree with <code>jwalk</code> and ranks matches
              with <code>nucleo</code>, the matcher from the Helix editor. Frecency is
              zoxide-style: each path scores <code>Σ&nbsp;1/(hours&nbsp;since&nbsp;access&nbsp;+&nbsp;1)</code>,
              so a file you opened ten minutes ago beats one you opened a hundred
              times last year. Content search embeds ripgrep’s own crates
              (<code>grep-searcher</code> + <code>ignore</code>), so it respects
              your <code>.gitignore</code> and doesn’t shell out.
            </p>
            <p>
              Everything else, including sidebars, columns, previews and the
              terminal, is off until you turn it on.
            </p>
          </div>
        </section>

        <section className="shots-plate faceplate" aria-label="Screenshots">
          <ShotGallery shots={SHOTS} phoneMedia={PHONE} />
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Under the hood</div>
            <h2>One person, tested like a team</h2>
            <p className="aside-note">
              Counts are from the repository on 6 Oct 2026. The perf budgets
              are enforced in CI, so a regression fails the build.
            </p>
          </div>
          <div className="gauges">
            {[
              ["2,534", "commits since Jan 2026"],
              ["~2.7k", "unit test cases (vitest)"],
              ["193", "browser e2e specs"],
              ["56", "native Tauri e2e files"],
              ["~600", "Rust #\u2060[\u2060test\u2060] functions"],
              ["11", "CI workflows on 3 OSes"],
              ["595\u00a0ms", "startup p50, down from 837 ms"],
              ["<50\u00a0ms", "sort 10k entries (CI budget)"],
            ].map(([n, l]) => (
              <Screen key={l} tone="amber" className="gauge">
                <span className="gauge-n">{n}</span>
                <span className="gauge-l">{l}</span>
              </Screen>
            ))}
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Also in the box</div>
            <h2>Things you won’t find in the screenshots</h2>
          </div>
          <div className="features">
            <div className="feat">
              <h3>Replaces your file picker</h3>
              <p>On Linux it can act as the xdg-desktop-portal file chooser, so other apps’ Open dialogs get Ctrl+P too.</p>
            </div>
            <div className="feat">
              <h3>Twelve themes, plus yours</h3>
              <p>Drop a <code>.css</code> into <code>~/.config/<wbr />tauri-explorer/<wbr />themes</code>. It reloads while you edit it.</p>
            </div>
            <div className="feat">
              <h3>Splits and Miller columns</h3>
              <p>Tabs, dual pane, arbitrary splits, named workspaces, and a yazi-style column view.</p>
            </div>
            <div className="feat">
              <h3>Careful file ops</h3>
              <p>Undo, Trash with restore, a conflict resolver. Cut checks clipboard ownership, so a stale cut becomes a copy instead of a surprise move.</p>
            </div>
            <div className="feat">
              <h3>Plugins</h3>
              <p>AI rename, AI organize and image tools ship as plugins you can switch off. A plugin SDK is in preview.</p>
            </div>
            <div className="feat">
              <h3>No telemetry</h3>
              <p>Nothing phones home. Bug reports go out only when you send one (<code><ForOS>Alt+I</ForOS></code>).</p>
            </div>
          </div>
        </section>

        <section className="section alpha" id="alpha">
          <div>
            <div className="section-kicker">
              <Led color="signal" blink /> The alpha
            </div>
            <h2>Looking for a small first cohort of people who live in a file manager</h2>
            <div className="alpha-keys">
              <Key href={INVITE} tone="signal" size="lg">
                Join the alpha
              </Key>
              <DownloadKey repo={REPO} version={VERSION} />
            </div>
          </div>
          <div>
            <p className="alpha-lead">
              <strong>Testers get a direct line to me.</strong> Your reports of
              data loss or wrong-target operations jump the queue ahead of
              feature requests, and I’ll tell you what has been tested on your
              setup before you trust it with real files.
            </p>
            <p>
              To join, write with your OS, desktop environment and display
              scale. That is the whole sign-up.
            </p>
            <p className="alpha-alt">
              <span>
                No mail app? Write to <strong>{EMAIL}</strong>.
              </span>
              <CopyKey text={EMAIL} />
            </p>
            <p>
              Rather try it first? The builds are public: download {VERSION}{" "}
              and use it today, then write in when you’re ready.
            </p>
            <p>Before you say yes, here’s what it’s like today:</p>
            <ul>
              <li>
                <strong>Builds are unsigned.</strong> Windows shows SmartScreen.
                The macOS build is Apple Silicon only and not notarized (Intel
                Macs build from source).
              </li>
              <li>
                <strong>No auto-updater yet.</strong> New versions are on the
                release page.
              </li>
              <li>
                <strong>Start on a scratch folder.</strong> Try copy, move,
                rename and Trash on test files before you point it at anything
                you care about.
              </li>
              <li>
                <strong>Reporting is built in.</strong> Use the command palette
                (Report Issue) or <code><ForOS>Alt+I</ForOS></code>. Reports are public GitHub
                issues, so leave out private paths.
              </li>
            </ul>
          </div>
        </section>

        <section className="section" id="install">
          <div>
            <div className="section-kicker">Install</div>
            <h2>Install {VERSION}</h2>
            <p className="aside-note">
              Linux: AppImage, .deb, .rpm, a Nix flake and a PKGBUILD. macOS:
              arm64 .dmg. Windows: .msi or setup .exe.
            </p>
          </div>
          <div className="install">
            <div className="install-keys">
              <DownloadKey repo={REPO} version={VERSION} others />
            </div>
            <div className="install-nix">
              <span className="silk">or, with Nix</span>
              <Screen tone="olive" className="cmd">
                <code className="cmd-text">{NIX}</code>
              </Screen>
              <CopyKey text={NIX} size="lg" />
            </div>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Rust, Tauri v2, Svelte 5</strong>
          </div>
          <div>
            Platforms<strong>Linux · macOS · Windows</strong>
          </div>
          <div>
            Licence<strong>MIT</strong>
          </div>
          <div>
            Source
            <strong>
              <a href={REPO}>github/xnmp/tauri-explorer</a>
            </strong>
          </div>
        </section>

      </main>
      <footer className="folio">
        <span className="fine-only">
          Press <Cap>/</Cap> for the other modules
        </span>
        <span>01 / 11</span>
      </footer>
    </>
  );
}
