---
slug: quickshell-statusbar
glyph: 欄
title: Quickshell bar
summary: "The bar on my Hyprland desktop, including what the coding agents are doing."
heading: "Keeping track of my desktop"
href: /p/quickshell-statusbar
repo: 'https://github.com/xnmp-setup/quickshell-statusbar'
tags:
  - qml
  - hyprland
  - python
  - ricing
index: "My Hyprland bar · agent state and quota pacing"
stats:
  - "Hyprland"
  - "Agent state"
  - "Quota history"
art: /screens/quickshell-statusbar.png
status: producing
shelf: tools
tone: cyan
metadata:
  title: "Quickshell bar · chong"
  description: "Notes on my Hyprland status bar: workspace windows, coding-agent state, machine load and AI quota pacing."
order: 4
---

<!-- block: all-projects -->
← all projects

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
The bar on my desktop

<!-- block: introduction -->
I usually have several terminals running Claude Code or Codex at once. The bar puts each workspace’s windows and the state of the agents inside them in one strip, so I can see which one is waiting for me without switching to it.

I also want to know when the machine is getting busy, and whether I'm burning through my Claude or Codex allowance too quickly. Those ended up in the same bar.

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
How the information gets there

<!-- block: from-readme -->
It started in my dotfiles and now has its own repository.

<!-- block: body-how-the-information-gets-there -->
It's a Quickshell configuration for Hyprland. Each workspace shows the icons of its windows. Terminals also show counts and states for the Claude and Codex sessions inside them.

There are the usual Wi-Fi, battery and clock cells, plus an optional music cell. Focus switches off notifications and can block a list of sites through `/etc/hosts`.

The agent state comes from a terminal hook in my dotfiles, which leaves files under `$XDG_RUNTIME_DIR`. The bar reads those files. Without the hook, it can still show windows, but it doesn't know what the agents are doing.

<!-- block: technical-choices -->
Underneath

<!-- block: a-pure-core-an-imperative-shell-and-a-contract-between-lan -->
Python gathers it, QML displays it

<!-- block: body-python-gathers-it-qml-displays-it -->
Two Python streams gather workspace, system and quota information, then send JSON to QML. The parsing and pacing rules are separate from the subprocesses that collect the readings. The workspace stream normally updates once a second.

### Keeping the two sides in sync

The Python and QML tests share this fixture. It helps catch a change on one side that the other side doesn't understand.

### Missing or odd readings

Both ends check the values they receive. Missing telemetry shouldn't become a wild percentage or an enormous list of windows.

### An estimate of my day

The quota calculation estimates my active hours from days when usage actually rose. Until it has enough history, it assumes eight hours.

### The site blocker

The site blocker only edits its marked section of `/etc/hosts`. It needs a one-time privileged setup; notification silencing works separately.

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

<!-- block: quota-pacing -->
Quota pacing

<!-- block: budget-per-day-instead-of-per-hour -->
How much can I use today?

<!-- block: body-how-much-can-i-use-today -->
Dividing the remaining quota by every hour until reset treats sleeping as wasted allowance. For longer quota windows, I spread what's left at the start of the day across the remaining days instead. The hourly line uses an estimate of how many hours I'm actually active.

The history is still just a sequence of readings. A rise belongs to the day when I first saw it. If there's a long gap across midnight, I leave it unattributed rather than pretend to know when it happened.

Claude’s numbers come from the OAuth usage endpoint that Claude Code itself uses, with the credentials Claude Code already has on disk. Codex’s come from the Codex CLI. History is kept in the cache directory and is only re-recorded every 30 minutes when a reading has not changed.

<!-- block: verified-numbers -->
My setup

<!-- block: what-is-in-the-repo -->
Part of the dotfiles

<!-- block: counted-from-the-checkout-test-counts-are-def-test-and-fun -->
The repository was extracted from my chezmoi configuration, with its history.

<!-- block: body-part-of-the-dotfiles -->
- Chezmoi deploys the bar and links the stream helpers into place.
- Python handles the readings and quota calculations. QML handles the bar and its menus.
- A few shell helpers cover Wi-Fi, workspace renaming and the site blocker.
- Some of the pieces depend on the rest of my desktop configuration, especially terminal-side agent state.

One small setup trap: the QML checks need the Qt 6 test runner. The `qmltestrunner` on PATH can be Qt 5, which led to some unhelpful failures.

<!-- block: rough-edges -->
The dependencies show

<!-- block: what-it-assumes-and-what-can-break -->
It's quite specific to my desktop

<!-- block: body-its-quite-specific-to-my-desktop -->
- It targets Hyprland on Wayland with Quickshell. Nothing in it is meant to work on other compositors, and I have not tested any.
- The Claude quota endpoint is the one Claude Code uses, not a documented public API. If it changes, the Claude cell loses its reading until I fix the parser.
- Agent state needs a hook on the terminal side. Without the WezTerm hook, the chips show windows and icons but no agent state.
- Focus needs a one-time root setup: install the script and add a sudoers entry. Without it, the cell still silences notifications and the site blocking fails quietly.
- I haven't measured the bar's own CPU cost yet.

### Open question

The quota pacing is an approximation. My schedule is uneven, and I'm still figuring out what would make the hourly line useful without making it nag me.

<!-- block: materialsqml-qt-6-python-3 -->
Materials**QML (Qt 6), Python 3.12 via uv, shell**

<!-- block: vintageaug-2026-to-now -->
Vintage**Aug 2026 to now**

<!-- block: statusactive -->
Status**Active**

<!-- block: source-github-xnmp-setup-quickshell-statusbar-https-github -->
Source **[github/xnmp-setup/quickshell-statusbar](https://github.com/xnmp-setup/quickshell-statusbar)**
