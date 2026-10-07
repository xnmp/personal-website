import type { Metadata } from "next";
import Link from "next/link";
import { RunningHead, Tags, Tag, OpenQuestion, Plate, Features, Feature } from "@/components/notebook";
import { Screen, Cap } from "@/components/rack";

export const metadata: Metadata = {
  title: "Ballast: a mood diary made of markdown files",
  description:
    "A local-first mood diary for desktop and Android. Each entry is a markdown file with YAML frontmatter, and a hand-edited file that no longer parses is kept byte for byte.",
};

export default function Page() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            03 &nbsp;·&nbsp; Ballast &nbsp;·&nbsp; <span className="filed">active</span>
          </>
        }
        nav={
          <>
            <Link href="/">← the rack</Link>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <div className="kicker">03 · Ballast</div>
            <h1>A mood diary that keeps every entry as a plain markdown file.</h1>
            <p>
              The tagline in the README is “The weight that keeps a ship stable while it
              changes course.” I use it the way I used Daylio: open it, pick one of five
              moods, tick a few activities, write something if I feel like it.
            </p>
            <p>
              The data is a folder of files I can grep and sync with Syncthing. It runs on the
              desktop through Tauri 2 and on my phone as an Android app. The source is private.
            </p>
          </div>
          <div>
            <Screen art="/screens/ballast.png" tone="olive" />
            <Tags>
              <Tag>svelte 5</Tag>
              <Tag>tauri 2</Tag>
              <Tag>kotlin</Tag>
              <Tag>local-first</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">What it is</div>
            <h2>Daylio’s loop, minus the account</h2>
          </div>
          <div>
            <p>
              Each entry has a timestamp, one of five moods (rad, good, meh, bad, awful), a list of
              activities and a free-text note. Activities are mine to define at runtime. The
              five-step mood scale is the one fixed vocabulary, which I took from Daylio on
              purpose.
            </p>
            <p>
              The bottom nav is Entries, a plus button, Calendar and More. Entries are paged by
              month. Several entries on one day are normal, since I log a morning and an evening.
            </p>
            <p>
              The app does no stats, goals, streaks or reminders. The bar for adding anything is
              whether I would actually use it.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The data</div>
            <h2>One file per entry</h2>
            <p className="aside-note">
              Layout from README.md and docs/rewrite-v1.md. The note and activity ids below are
              placeholders, not one of my entries.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 1 · BallastData/"
              caption="The filename is the authority on when an entry happened, so one directory listing is enough to build the month index."
            >
              <pre>{`BallastData/
  entries/2026-07-27_1005.md
  activities.json    # [{ id, name, icon, archived? }]
  briefs/            # optional, written by something else
  .ballast/          # recovery journals, normally empty

--- entries/2026-07-27_1005.md ---
---
id: "entry-1fdd93a0-…"
at: "2026-07-27T10:05"
mood: "good"
activities:
  - "walk"
  - "reading"
---
Placeholder note text, kept verbatim.`}</pre>
            </Plate>
            <p>
              Moods are stored by name so a grep for <code>{`mood: "awful"`}</code> works. Activities
              are stored by stable id, so renaming one in the settings changes how old entries
              display without touching their files. Entries have their own opaque id, separate
              from the filename, so changing an entry’s time does not change its identity.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Technical choices</div>
            <h2>Treating the files as something other tools will edit</h2>
          </div>
          <div>
            <Features>
              <Feature label="Parsers never throw">
                <code>parseEntry</code> in <code>src/lib/persistence/entryFile.ts</code> falls back
                to the filename for the time and treats the whole file as the note when the
                frontmatter will not parse. A file I broke by hand stays readable and is written
                back unchanged.
              </Feature>
              <Feature label="Staged Daylio import">
                <code>scripts/import-real.ts</code> refuses a target folder that already exists.
                The import is staged and verified, then made visible, so it cannot overwrite a
                diary. It prints counts only, never entry text.
              </Feature>
              <Feature label="Ports and adapters">
                A pure domain, a framework-free application layer, and one{" "}
                <code>StoragePort</code> with memory, Tauri filesystem and Android SAF
                implementations. One shared contract suite runs against all of them.
              </Feature>
              <Feature label="Custom Tauri plugins">
                Three in-repo plugins, each Rust plus Kotlin: <code>data-folder</code> (the Android
                Storage Access Framework), <code>brief-notifications</code> and{" "}
                <code>app-update</code>.
              </Feature>
              <Feature label="Daily brief via WorkManager">
                Something else can drop a markdown brief and a <code>latest.json</code> into a
                synced <code>briefs/</code> folder. Android checks it about every 15 minutes with
                WorkManager, verifies the SHA-256 in the manifest, and posts a notification.
              </Feature>
              <Feature label="Feedback to GitHub issues">
                The More screen files bugs and feature requests as GitHub issues. The token stays on
                the machine, outside the synced folder, and a screenshot upload is rolled back if
                the issue fails to create.
              </Feature>
            </Features>
            <p>
              Writes go through a temporary file and a rename on desktop, and a
              temporary-and-backup swap on Android. Creating a new entry uses exclusive create, so
              a stale directory listing cannot make it overwrite a file that Syncthing just
              delivered. A malformed <code>activities.json</code> makes loading and saving fail
              visibly instead of being treated as a first run.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Verified numbers</div>
            <h2>What the last release recorded</h2>
            <p className="aside-note">
              From docs/handover-2026-10-02-release.txt and the git log. Counts are as of release
              0.3.5.
            </p>
          </div>
          <div>
            <ul>
              <li>133 commits between 2026-07-05 and 2026-10-02.</li>
              <li>
                599 unit tests and 102 browser e2e tests passed for 0.3.5, plus Rust formatting,
                tests and Clippy, Android plugin tests, and real-emulator keyboard tests in CI.
              </li>
              <li>
                The signed Android bundle for 0.3.5 is 21,009,953 bytes and went to the Google Play
                internal testing track.
              </li>
              <li>
                A CI gate measures idle background behaviour on an API 35 emulator: it fails if the
                app uses more than a small CPU allowance, touches the network, renders more than
                three frames or holds wake locks over 250 ms while backgrounded.
              </li>
            </ul>
            <p>
              Version 1 was a much larger personal research instrument, and the rewrite removed most
              of it. It is still on the <code>pre-rewrite</code> git tag, and its snapshot document
              records 104 passing tests (9 test files) at that point.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Rough edges</div>
            <h2>The rewrite that cut scope, and what is unsettled</h2>
          </div>
          <div>
            <p>
              <code>docs/rewrite-v1.md</code> is the plan for the rewrite. It lists what v2
              leaves out: stats, goals, streaks, reminders, photos, search, encryption and sync.
              Sync is Syncthing’s job. The old experiments, protocols and job board were removed
              outright.
            </p>
            <ul>
              <li>
                Edits are checked against a revision just before they are written, but the storage
                providers have no atomic compare-and-swap. A writer that lands in the gap after
                that check can still win.
              </li>
              <li>
                The last release reached Play’s internal testing track. The handover says
                installation on a physical phone was not observed during that session.
              </li>
              <li>
                The source is private, so the numbers above are mine and nobody else can rerun them.
              </li>
            </ul>
            <OpenQuestion>
              Stats are deferred, not ruled out, and the bottom nav has room for a slot. I have no
              rule yet for what “missed in practice” means, so I do not know when
              one would get built.
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Svelte 5, Tauri 2, Rust, Kotlin</strong>
          </div>
          <div>
            Vintage<strong>July 2026 to now</strong>
          </div>
          <div>
            Status<strong>Active, v0.3.5</strong>
          </div>
          <div>
            Source<strong>private</strong>
          </div>
        </section>

      </main>
      <footer className="folio">
        <span className="fine-only">
          Press <Cap>/</Cap> for the other modules
        </span>
        <span>03 / 11</span>
      </footer>
    </>
  );
}
