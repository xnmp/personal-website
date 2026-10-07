import type { Metadata } from "next";
import Link from "next/link";
import { RunningHead, Tags, Tag, OpenQuestion, Plate, Features, Feature } from "@/components/notebook";
import { Screen, Cap } from "@/components/rack";

const REPO = "https://github.com/xnmp/scrivo";

export const metadata: Metadata = {
  title: "Scrivo: a markdown reader that paints first",
  description:
    "A Typora-style markdown reader and editor on Tauri 2. Rust renders the reading view while the window opens, and the editor only decorates your text, so it never reformats the file.",
};

export default function Page() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            02 &nbsp;·&nbsp; Scrivo &nbsp;·&nbsp; <span className="filed">active</span>
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

        <section className="detail-hero">
          <div>
            <div className="kicker">02 · Scrivo</div>
            <h1>A markdown reader that paints first and an editor that never reformats.</h1>
            <p>
              I wanted Typora’s way of writing without waiting for it to start. Scrivo opens a
              file in a reading view that Rust has already rendered, and Ctrl+E turns the same
              window into a live-preview editor.
            </p>
            <p>
              The editor is built so it cannot rewrite your file. It puts decorations over the
              text you typed and never converts it to a document model and back.
            </p>
          </div>
          <div>
            <Screen art="/screens/scrivo.png" tone="cyan" />
            <Tags>
              <Tag>rust</Tag>
              <Tag>tauri 2</Tag>
              <Tag>codemirror 6</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">What it is</div>
            <h2>Two surfaces over one text buffer</h2>
            <p className="aside-note">From docs/ARCHITECTURE.md in the repo.</p>
          </div>
          <div>
            <p>
              Run <code>scrivo notes.md</code> and you get the reading view. The Rust crate{" "}
              <code>scrivo-render</code> (pulldown-cmark plus math-core) turns the file into HTML
              and MathML in parallel with the window being created. Code highlighting loads after
              the document is on screen.
            </p>
            <p>
              Press Ctrl+E and the editor takes over. It is CodeMirror 6 with a live preview: the
              syntax melts away as you write, and tables, math and images render in place. Both surfaces carry positions across as 1-based source lines, so
              you land where you were.
            </p>
            <p>
              It also has tabs, a command palette, a Contents sidebar, find, folding, an
              Obsidian-theme importer, and autosave two seconds after you stop typing.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Technical choices</div>
            <h2>Why the editor cannot reformat your file</h2>
          </div>
          <div>
            <p>
              Editors built on ProseMirror (Milkdown, Tiptap) parse markdown into a document tree
              and serialise it back on save. That round trip is where list markers change, escapes
              appear and tables get rewritten. Obsidian, Zettlr and SilverBullet use CodeMirror
              live preview for this reason, and so does Scrivo.
            </p>
            <Features>
              <Feature label="Text is the source of truth">
                The editor draws decorations over the buffer. Nothing serialises a model back to
                markdown. Table cell edits are ordinary undoable transactions on the source.
              </Feature>
              <Feature label="BOM and line endings kept">
                <code>src/domain/text-format.ts</code> records the BOM and the dominant line ending
                on load and restores them on save. Invalid UTF-8 is refused instead of being
                decoded lossily and written back.
              </Feature>
              <Feature label="Safe by construction">
                The renderer builds HTML from parse events. No markup from the document passes
                through, so the page can insert the result as HTML.
              </Feature>
              <Feature label="Crash recovery copy">
                Dirty text goes to a private recovery file in app data, written atomically and
                throttled to 500 ms. On the next launch it offers Restore or Discard, and
                restoring never overwrites a newer file on disk.
              </Feature>
              <Feature label="Ports and adapters">
                <code>src/domain</code> is pure TypeScript with no DOM, no CodeMirror view and no
                Tauri. The app talks to a <code>Platform</code> port, and tests use an in-memory
                adapter.
              </Feature>
              <Feature label="Chunked first paint">
                The renderer reports safe block boundaries. The viewer parses the first HTML chunk
                before paint and inserts the rest in idle slices.
              </Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Verified numbers</div>
            <h2>Startup against real Typora</h2>
            <p className="aside-note">
              Source: README.md and bench/results/verified-{"{medium,large}"}-chunked.txt in the
              repo. One Linux machine, so read these as relative.
            </p>
          </div>
          <div>
            <p>
              <code>bench/ab.mjs</code> launches Typora and Scrivo in turns inside the same
              1280×720 headless compositor, and rotates which one goes first each round. Times
              start at process launch and include the window system and webview. “Content”
              is the first screenshot that matches a reference frame I reviewed by hand, to within
              0.3% of image tiles. A run that shows a loading screen, an error or no window, or
              hits the 20 second cap, counts as invalid.
            </p>
            <p>
              Measured on 2026-09-27 with release commit <code>129cd13</code>, Typora 1.14.9-1, and
              12 valid rounds per file. Medians in milliseconds, lower is better:
            </p>
            <Plate
              figure="FIG. 1 · time to verified first viewport"
              caption="Content median, paired rounds. Scrivo was faster in 12 of 12 pairs on both files; the paired-median gaps are 626 ms (medium) and 1,682 ms (large)."
            >
              <pre>{`file              app      window   content
medium  8.8 KB    Typora      411       965
                  Scrivo      211       340
large   443 KB    Typora      433     2,016
                  Scrivo      211       356`}</pre>
            </Plate>
            <p>
              Scrivo’s time barely moves with file size because the first chunk is all it
              needs before paint. “Complete” here means the viewport stopped changing,
              not that all 443 KB has been inserted. A native e2e test separately checks that the
              tail of the large file renders and can be scrolled to.
            </p>
            <p>
              The repo has 58 commits between 2026-09-26 and 2026-10-05 and 106 test files: 17
              domain, 39 browser e2e, 31 native e2e, the rest beside the app code. The Rust crates
              hold 99 <code>#[test]</code> functions.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Frames</div>
            <h2>The two reference frames</h2>
            <p className="aside-note">
              These are the files in bench/references that the benchmark matches against.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 2 · Scrivo, medium.md, 1280×720"
              caption="Reading view in the default light appearance. The status line says Reading · Ctrl+E to edit."
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/scrivo-medium.webp" alt="Scrivo reading view of the benchmark medium document: a heading, a paragraph with inline styles, a blockquote and nested lists." width={1280} height={720} loading="lazy" className="shot-img" />
            </Plate>
            <Plate
              figure="FIG. 3 · Typora, medium.md, 1280×705 (cropped)"
              caption="Same file in Typora with a dark theme. The themes differ, so compare the content and timing, not the colours."
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/typora-medium-crop.webp" alt="Typora showing the same benchmark document in a dark theme with wider paragraph spacing." width={1280} height={705} loading="lazy" className="shot-img" />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Rough edges</div>
            <h2>What did not pan out, and what I have not checked</h2>
          </div>
          <div>
            <p>
              Several startup experiments came back as noise, and the README keeps them. Inserting
              up to two HTML chunks per idle slice made the full large document land 419 ms sooner,
              but the first-viewport change was −3 ms on medium and +5 ms on large, which I read as
              nothing. Parsing the first chunk before paint saved 20 ms on large (10 of 12 pairs).
              The complete-preview path was 38 ms faster on a 5 MB synthetic file and 6 to 7 ms
              slower on medium.
            </p>
            <ul>
              <li>
                Mixed line endings get normalised to the dominant one on save. The UI says so, but
                it is a rewrite, and the editor is only lossless for files with one style.
              </li>
              <li>
                Recovery writes are asynchronous. A process killed before the write finishes can
                lose the last few keystrokes.
              </li>
              <li>
                Obsidian theme import covers CSS variables only. Layouts, plugins and companion
                assets are not supported.
              </li>
              <li>
                I have only benchmarked on Linux, with Typora 1.14.9-1 running headless in the same
                compositor. Numbers on macOS and Windows are unmeasured.
              </li>
            </ul>
            <OpenQuestion>
              Typora does more than Scrivo does, so part of that gap may be scope and not
              engineering. I do not have a way to separate “Scrivo is
              well built” from “Scrivo does less”, and the benchmark does not
              claim to.
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Rust, Tauri 2, TypeScript, CodeMirror 6</strong>
          </div>
          <div>
            Vintage<strong>Sept 2026 to now</strong>
          </div>
          <div>
            Status<strong>Active</strong>
          </div>
          <div>
            Source
            <strong>
              <a href={REPO}>github/xnmp/scrivo</a>
            </strong>
          </div>
        </section>

      </main>
      <footer className="folio">
        <span className="fine-only">
          Press <Cap>/</Cap> for the other modules
        </span>
        <span>02 / 11</span>
      </footer>
    </>
  );
}
