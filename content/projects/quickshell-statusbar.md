---
slug: quickshell-statusbar
glyph: 欄
title: Quickshell bar
heading: A status bar that shows what my coding agents are doing.
href: /p/quickshell-statusbar
repo: 'https://github.com/xnmp-setup/quickshell-statusbar'
tags:
  - qml
  - hyprland
  - python
  - ricing
index: Hyprland status bar · live Claude/Codex agent state · quota pacing
stats:
  - 53 commits
  - 275 tests (py + qml)
  - 1 Hz JSON stream
art: /screens/quickshell-statusbar.png
status: producing
shelf: tools
tone: cyan
metadata:
  title: 'Quickshell bar: what my coding agents are doing'
  description: >-
    A Quickshell status bar for Hyprland. Workspace chips show per-window icons
    and live Claude and Codex agent state, and the quota cells pace my usage
    against a budget learned from my active hours.
order: 4
---
<!-- block: all-projects -->
← all projects

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
A status bar that shows what my coding agents are doing.

<!-- block: i-usually-have-several-terminals-running-claude-code-or-co -->
I usually have several terminals running Claude Code or Codex at once. The bar puts each workspace’s windows and the state of the agents inside them in one strip, so I can see which one is waiting for me without switching to it.

<!-- block: it-also-shows-cpu-ram-io-gpu-and-vram-with-hover-sparkline -->
It also shows CPU, RAM, IO, GPU and VRAM with hover sparklines, and two quota cells that tell me whether I am spending my Claude and Codex allowance too fast.

<!-- block: qml -->
qml

<!-- block: hyprland -->
hyprland

<!-- block: python -->
python

<!-- block: ricing -->
ricing

<!-- block: what-it-is -->
What it is

<!-- block: a-qml-bar-fed-by-two-python-streams -->
A QML bar fed by two Python streams

<!-- block: from-readme -->
From README.md and the sources in the repo.

<!-- block: the-bar-is-a-quickshell-qt-6-configuration-for-hyprland -->
The bar is a Quickshell (Qt 6) configuration for Hyprland. Each workspace is a chip with the application icon of every window in it. For terminal windows the chip also carries counts and a state for each Claude and Codex session running inside.

<!-- block: other-cells-wi-fi-with-a-picker-backed-by-nmcli-battery-on -->
Other cells: Wi-Fi with a picker backed by `nmcli`, battery on laptops, a clock, an optional now-playing cell, and Focus. Focus turns on mako’s do-not-disturb mode and blocks a list of sites in `/etc/hosts`.

<!-- block: the-agent-state-comes-from-files-a-wezterm-hook-writes-und -->
The agent state comes from files a WezTerm hook writes under `$XDG_RUNTIME_DIR`. That hook lives in my dotfiles, not in this repo, and the bar only reads what it leaves.

<!-- block: technical-choices -->
Technical choices

<!-- block: a-pure-core-an-imperative-shell-and-a-contract-between-lan -->
A pure core, an imperative shell, and a contract between languages

<!-- block: lib-hypr-status-stream -->
`lib/hypr_status_stream.py` and `lib/ai_usage_stream.py` have the same shape. A pure domain core holds the parsers and rules: `parse_cpu_times`, `cpu_percent`, `parse_diskstats`, `assign_wezterm_windows` and so on. A thin shell in `lib/stream_kit.py` runs subprocesses with a timeout, throttles the expensive refreshes, and prints one compact JSON object per line. The hypr stream defaults to one line per second.

<!-- block: figure-fig-1-one-line-of-the-stream-reformatted -->
FIG. 1 · one line of the stream, reformatted

<!-- block: caption-from-tests-fixtures-stream-contract-json-trimmed-t -->
From tests/fixtures/stream_contract.json, trimmed to one workspace and the Claude quota. The real stream prints each object on a single line.

<!-- block: code-hypr-metrics-cpu-42-ram-63-io-7-gpu-18-vram-36-batter -->
```
{"hypr": {
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
    "history": [[1799990000, 40, 22], [1799996000, 41, 24]] } } }
```

<!-- block: tests-test-stream-contract -->
`tests/test_stream_contract.py` proves the Python streams emit the fixture’s exact structure. `tests/tst_statusbar.qml` proves the QML sanitiser accepts the same file without dropping or renaming a field. Neither side can drift alone.

<!-- block: label-contract-test-from-both-ends -->
Contract test from both ends

<!-- block: python-coerces-untrusted-values-with-helpers-like-bounded -->
Python coerces untrusted values with helpers like `bounded_percent`. `StatusSanitizer.js` then caps the payload again: 64 workspaces, 128 clients per workspace, 32 activities per client, 2,048 usage samples.

<!-- block: label-sanitised-on-both-sides -->
Sanitised on both sides

<!-- block: quickshell-usagebudget -->
`quickshell/UsageBudget.js` takes the median number of clock hours per day in which my quota actually rose, clamps it to 4 to 16, and uses 8 until two complete days are on record.

<!-- block: label-pacing-that-learns -->
Pacing that learns

<!-- block: bin-focus-block-rewrites-only-a-marker-fenced-section-refu -->
`bin/focus-block` rewrites only a marker-fenced section, refuses a symlinked hosts file (NixOS), and refuses to install one without the localhost line. The sudoers grant allows only `on` and `off`.

<!-- block: label-focus-edits-etc-hosts-carefully -->
Focus edits /etc/hosts carefully

<!-- block: quota-pacing -->
Quota pacing

<!-- block: budget-per-day-instead-of-per-hour -->
Budget per day instead of per hour

<!-- block: dividing-what-is-left-by-the-hours-until-reset-is-far-too -->
Dividing what is left by the hours until reset is far too strict, because nobody spends quota around the clock. So for windows of at least two days the bar takes the quota left when today began and spreads it over the wall-clock time to reset. That is today’s allowance. The hourly burn line divides the allowance by the active hours per day learned above.

<!-- block: where-a-quota-went-is-attributed-from-the-history-of-readi -->
Where a quota went is attributed from the history of readings. A rise is charged to the day of the reading that first shows it. If two readings are more than three hours apart with a midnight between them, the rise is left unattributed instead of being guessed. The pieces always add up to the percentage the bar shows.

<!-- block: claude-s-numbers-come-from-the-oauth-usage-endpoint-that-c -->
Claude’s numbers come from the OAuth usage endpoint that Claude Code itself uses, with the credentials Claude Code already has on disk. Codex’s come from the Codex CLI. History is kept in the cache directory and is only re-recorded every 30 minutes when a reading has not changed.

<!-- block: verified-numbers -->
Verified numbers

<!-- block: what-is-in-the-repo -->
What is in the repo

<!-- block: counted-from-the-checkout-test-counts-are-def-test-and-fun -->
Counted from the checkout; test counts are `def test_` and `function test_` matches.

<!-- block: 53-commits-between-2026-08-06-and-2026-09-28 -->
53 commits between 2026-08-06 and 2026-09-28.

<!-- block: 138-python-test-methods-across-the-stream-kit-contract-and -->
138 Python test methods across the stream, kit, contract and Wi-Fi tests, and 137 QML test functions (98 in `tst_statusbar.qml`, 27 on `UsageBudget.js`).

<!-- block: three-shell-test-scripts-for-focus-block-rename-hypr-works -->
Three shell test scripts, for `focus-block`, `rename-hypr-workspace` and `wifi-control`.

<!-- block: about-9-700-lines-across-the-python-qml-and-javascript-sou -->
About 9,700 lines across the Python, QML and JavaScript sources.

<!-- block: the-qml-tests-run-offscreen-with-a-stub-for-the-quickshell -->
The QML tests run offscreen with a stub for the Quickshell module, whose C++ plugin only loads inside the `quickshell` binary. They need the Qt 6 `qmltestrunner`. The one on `PATH` is often Qt 5 and fails silently, which the README calls out.

<!-- block: rough-edges -->
Rough edges

<!-- block: what-it-assumes-and-what-can-break -->
What it assumes and what can break

<!-- block: it-targets-hyprland-on-wayland-with-quickshell -->
It targets Hyprland on Wayland with Quickshell. Nothing in it is meant to work on other compositors, and I have not tested any.

<!-- block: the-claude-quota-endpoint-is-the-one-claude-code-uses-not -->
The Claude quota endpoint is the one Claude Code uses, not a documented public API. If it changes, the Claude cell loses its reading until I fix the parser.

<!-- block: agent-state-needs-a-hook-on-the-terminal-side -->
Agent state needs a hook on the terminal side. Without the WezTerm hook, the chips show windows and icons but no agent state.

<!-- block: focus-needs-a-one-time-root-setup-install-the-script-and-a -->
Focus needs a one-time root setup: install the script and add a sudoers entry. Without it, the cell still silences notifications and the site blocking fails quietly.

<!-- block: i-have-not-measured-the-streams-own-cpu-cost-so-i-cannot-s -->
I have not measured the streams’ own CPU cost, so I cannot say what the bar costs to run.

<!-- block: the-active-hours-figure-is-a-median-over-days-that-saw-any -->
The active-hours figure is a median over days that saw any use, clamped to 4 to 16. I do not know if a median is the right statistic for a schedule as uneven as mine, and the comments in the code say it errs toward a looser hourly line.

<!-- block: materialsqml-qt-6-python-3 -->
Materials**QML (Qt 6), Python 3.12 via uv, shell**

<!-- block: vintageaug-2026-to-now -->
Vintage**Aug 2026 to now**

<!-- block: statusactive -->
Status**Active**

<!-- block: source-github-xnmp-setup-quickshell-statusbar-https-github -->
Source **[github/xnmp-setup/quickshell-statusbar](https://github.com/xnmp-setup/quickshell-statusbar)**
