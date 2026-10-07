import type { Metadata } from "next";
import { RunningHead, Tags, Tag, OpenQuestion, Plate, Features, Feature } from "@/components/notebook";
import { Screen, Cap, Key } from "@/components/rack";

const REPO = "https://github.com/xnmp-setup/quickshell-statusbar";

export const metadata: Metadata = {
  title: "Quickshell bar: what my coding agents are doing",
  description:
    "A Quickshell status bar for Hyprland. Workspace chips show per-window icons and live Claude and Codex agent state, and the quota cells pace my usage against a budget learned from my active hours.",
};

export default function Page() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            04 &nbsp;·&nbsp; Quickshell bar &nbsp;·&nbsp; <span className="filed">active</span>
          </>
        }
        nav={
          <>
            <Key href="/">← all projects</Key>
            <Key href={REPO}>GitHub ↗</Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <div className="kicker">04 · Quickshell bar</div>
            <h1>A status bar that shows what my coding agents are doing.</h1>
            <p>
              I usually have several terminals running Claude Code or Codex at once. The bar puts
              each workspace’s windows and the state of the agents inside them in one strip,
              so I can see which one is waiting for me without switching to it.
            </p>
            <p>
              It also shows CPU, RAM, IO, GPU and VRAM with hover sparklines, and two quota cells
              that tell me whether I am spending my Claude and Codex allowance too fast.
            </p>
          </div>
          <div>
            <Screen art="/screens/quickshell-statusbar.png" tone="cyan" />
            <Tags>
              <Tag>qml</Tag>
              <Tag>hyprland</Tag>
              <Tag>python</Tag>
              <Tag>ricing</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">What it is</div>
            <h2>A QML bar fed by two Python streams</h2>
            <p className="aside-note">From README.md and the sources in the repo.</p>
          </div>
          <div>
            <p>
              The bar is a Quickshell (Qt 6) configuration for Hyprland. Each workspace is a chip
              with the application icon of every window in it. For terminal windows the chip also
              carries counts and a state for each Claude and Codex session running inside.
            </p>
            <p>
              Other cells: Wi-Fi with a picker backed by <code>nmcli</code>, battery on laptops, a
              clock, an optional now-playing cell, and Focus. Focus turns on mako’s
              do-not-disturb mode and blocks a list of sites in <code>/etc/hosts</code>.
            </p>
            <p>
              The agent state comes from files a WezTerm hook writes under{" "}
              <code>$XDG_RUNTIME_DIR</code>. That hook lives in my dotfiles, not in this repo, and
              the bar only reads what it leaves.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Technical choices</div>
            <h2>A pure core, an imperative shell, and a contract between languages</h2>
          </div>
          <div>
            <p>
              <code>lib/hypr_status_stream.py</code> and <code>lib/ai_usage_stream.py</code> have
              the same shape. A pure domain core holds the parsers and rules:{" "}
              <code>parse_cpu_times</code>, <code>cpu_percent</code>, <code>parse_diskstats</code>,{" "}
              <code>assign_wezterm_windows</code> and so on. A thin shell in{" "}
              <code>lib/stream_kit.py</code> runs subprocesses with a timeout, throttles the
              expensive refreshes, and prints one compact JSON object per line. The hypr stream
              defaults to one line per second.
            </p>
            <Plate
              figure="FIG. 1 · one line of the stream, reformatted"
              caption="From tests/fixtures/stream_contract.json, trimmed to one workspace and the Claude quota. The real stream prints each object on a single line."
            >
              <pre>{`{"hypr": {
  "metrics": { "cpu": 42, "ram": 63, "io": 7, "gpu": 18, "vram": 36,
               "battery": 88, "batteryState": "discharging",
               "wifi": 61, "cpuTemp": 78, "gpuTemp": null },
  "workspaces": [{
    "id": 1, "name": "dev", "monitor": "DP-2",
    "clients": [{
      "class": "org.wezfurlong.wezterm", "label": "WezTerm",
      "title": "codex | repo", "tabs": 2, "claude": 1, "codex": 1,
      "activities": [
        { "kind": "claude", "state": "idle", "title": "task" },
        { "kind": "codex",  "state": "idle", "title": "repo" } ]
    }],
    "claude": 1, "codex": 1 }] },
 "usage": { "claude": {
    "percent": 41, "windowMinutes": 10080,
    "secondaryPercent": 24, "secondaryWindowMinutes": 300,
    "history": [[1799990000, 40, 22], [1799996000, 41, 24]] } } }`}</pre>
            </Plate>
            <Features>
              <Feature label="Contract test from both ends">
                <code>tests/test_stream_contract.py</code> proves the Python streams emit the
                fixture’s exact structure. <code>tests/tst_statusbar.qml</code> proves the QML
                sanitiser accepts the same file without dropping or renaming a field. Neither side
                can drift alone.
              </Feature>
              <Feature label="Sanitised on both sides">
                Python coerces untrusted values with helpers like <code>bounded_percent</code>.{" "}
                <code>StatusSanitizer.js</code> then caps the payload again: 64 workspaces, 128
                clients per workspace, 32 activities per client, 2,048 usage samples.
              </Feature>
              <Feature label="Pacing that learns">
                <code>quickshell/UsageBudget.js</code> takes the median number of clock hours per
                day in which my quota actually rose, clamps it to 4 to 16, and uses 8 until two
                complete days are on record.
              </Feature>
              <Feature label="Focus edits /etc/hosts carefully">
                <code>bin/focus-block</code> rewrites only a marker-fenced section, refuses a
                symlinked hosts file (NixOS), and refuses to install one without the localhost line.
                The sudoers grant allows only <code>on</code> and <code>off</code>.
              </Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Quota pacing</div>
            <h2>Budget per day instead of per hour</h2>
          </div>
          <div>
            <p>
              Dividing what is left by the hours until reset is far too strict, because nobody
              spends quota around the clock. So for windows of at least two days the bar takes the
              quota left when today began and spreads it over the wall-clock time to reset. That is
              today’s allowance. The hourly burn line divides the allowance by the active
              hours per day learned above.
            </p>
            <p>
              Where a quota went is attributed from the history of readings. A rise is charged to
              the day of the reading that first shows it. If two readings are more than three hours
              apart with a midnight between them, the rise is left unattributed instead of being
              guessed. The pieces always add up to the percentage the bar shows.
            </p>
            <p>
              Claude’s numbers come from the OAuth usage endpoint that Claude Code itself
              uses, with the credentials Claude Code already has on disk. Codex’s come from
              the Codex CLI. History is kept in the cache directory and is only re-recorded every 30
              minutes when a reading has not changed.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Verified numbers</div>
            <h2>What is in the repo</h2>
            <p className="aside-note">
              Counted from the checkout; test counts are <code>def test_</code> and{" "}
              <code>function test_</code> matches.
            </p>
          </div>
          <div>
            <ul>
              <li>53 commits between 2026-08-06 and 2026-09-28.</li>
              <li>
                138 Python test methods across the stream, kit, contract and Wi-Fi tests, and 137
                QML test functions (98 in <code>tst_statusbar.qml</code>, 27 on{" "}
                <code>UsageBudget.js</code>).
              </li>
              <li>
                Three shell test scripts, for <code>focus-block</code>,{" "}
                <code>rename-hypr-workspace</code> and <code>wifi-control</code>.
              </li>
              <li>About 9,700 lines across the Python, QML and JavaScript sources.</li>
            </ul>
            <p>
              The QML tests run offscreen with a stub for the Quickshell module, whose C++ plugin
              only loads inside the <code>quickshell</code> binary. They need the Qt 6{" "}
              <code>qmltestrunner</code>. The one on <code>PATH</code> is often Qt 5 and fails
              silently, which the README calls out.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Rough edges</div>
            <h2>What it assumes and what can break</h2>
          </div>
          <div>
            <ul>
              <li>
                It targets Hyprland on Wayland with Quickshell. Nothing in it is meant to work on other
                compositors, and I have not tested any.
              </li>
              <li>
                The Claude quota endpoint is the one Claude Code uses, not a documented public API.
                If it changes, the Claude cell loses its reading until I fix the parser.
              </li>
              <li>
                Agent state needs a hook on the terminal side. Without the WezTerm hook, the chips
                show windows and icons but no agent state.
              </li>
              <li>
                Focus needs a one-time root setup: install the script and add a sudoers entry.
                Without it, the cell still silences notifications and the site blocking fails
                quietly.
              </li>
              <li>
                I have not measured the streams’ own CPU cost, so I cannot say what the bar costs
                to run.
              </li>
            </ul>
            <OpenQuestion>
              The active-hours figure is a median over days that saw any use, clamped to 4 to 16. I
              do not know if a median is the right statistic for a schedule as uneven as mine, and
              the comments in the code say it errs toward a looser hourly line.
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>QML (Qt 6), Python 3.12 via uv, shell</strong>
          </div>
          <div>
            Vintage<strong>Aug 2026 to now</strong>
          </div>
          <div>
            Status<strong>Active</strong>
          </div>
          <div>
            Source
            <strong>
              <a href={REPO}>github/xnmp-setup/quickshell-statusbar</a>
            </strong>
          </div>
        </section>

      </main>
      <footer className="folio">
        <span className="fine-only">
          Press <Cap>/</Cap> for the other projects
        </span>
        <span>04 / 11</span>
      </footer>
    </>
  );
}
