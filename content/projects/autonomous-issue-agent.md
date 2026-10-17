---
slug: autonomous-issue-agent
glyph: 工
title: Issue Agent
summary: A local harness that turns GitHub issues into reviewed pull requests.
heading: From a GitHub issue to a tested, independently reviewed merge.
href: /p/autonomous-issue-agent
repo: https://github.com/xnmp/autonomous-issue-agent
tags:
  - python
  - claude / codex
  - sqlite
  - react
index: Local coding-agent harness · GitHub issues to reviewed PRs · sandboxed fixer and reviewer
stats:
  - 10/10 issues merged
  - ~$5.60 / merged PR
  - 7/10 first-pass approvals
art: /screens/autonomous-issue-agent.png
status: producing
shelf: tools
tone: amber
metadata:
  title: 'Autonomous Issue Agent: issues to reviewed pull requests'
  description: >-
    A local Python harness that takes GitHub issues through planning, isolated
    implementation, CI and independent AI review, then merges to a development
    branch. With an operator dashboard and explicit spend limits.
order: 12
---
<!-- block: all-projects -->
← all projects

<!-- block: github -->
Source on GitHub

<!-- block: headline -->
From a GitHub issue to a tested, independently reviewed merge.

<!-- block: intro -->
I wanted to hand off small fixes without supervising every command. Label an issue `ai-ready`: the harness plans it, routes it to a Claude or Codex agent, opens a pull request, waits for CI and gets a separate agent to review the change.

<!-- block: ownership -->
Approved and green means a merge into the development branch, `dev` by default. Production is still my decision. The harness runs on my own Linux machine, against my repositories, using my AI accounts.

<!-- block: workflow-kicker -->
The loop

<!-- block: workflow-title -->
A fixer and an independent reviewer

<!-- block: workflow-body -->
A planning pass writes acceptance criteria and grades difficulty before the fixer starts. The fixer works in an isolated checkout and writes tests first. Failed CI or a request for changes sends it back with the evidence it needs. The reviewer uses a different GitHub identity, so it cannot approve its own work.

<!-- block: workflow-figure -->
FIG. 1 · the path to dev

<!-- block: workflow-code -->
```text
ai-ready → plan → fix → PR → CI → review → merge to dev
                  ↑          │       │
                  └─ repairs ┴───────┘

unclear task / exhausted attempts / spend cap → needs-human
```

<!-- block: workflow-caption -->
A PR with no CI checks cannot merge. Changes under `.github/` stop for human review.

<!-- block: dashboard-kicker -->
The dashboard

<!-- block: dashboard-title -->
See what is moving, and what needs me

<!-- block: dashboard-body -->
The React dashboard puts work that needs a person ahead of running and blocked issues. Each issue has a stage history, agent runs, model and cost information. The backend reads the control store without writing to it; operator actions change GitHub labels to promote an issue or release a hold.

<!-- block: board-figure -->
FIG. 2 · the in-flight board

<!-- block: board-caption -->
Dashboard capture from the repository’s browser tests, using fixture issues. Expanded rows explain the hold, history and spend. [Open full-size screenshot](/autonomous-issue-agent/board.webp).

<!-- block: board-alt -->
Issue Agent dashboard with Needs you, Working and Blocked groups, an expanded failed-attempts row, and resolve, review, CI and merge stages.

<!-- block: completed-figure -->
FIG. 3 · completed work

<!-- block: completed-caption -->
The completed-issues table shows PR links, cost, working and idle time, and models. This is also a browser-test fixture; its dollar figures are example data. [Open full-size screenshot](/autonomous-issue-agent/completed.webp).

<!-- block: completed-alt -->
Completed issues in the Issue Agent dashboard, with linked pull requests, cost, work and idle duration, model names and a filter.

<!-- block: architecture-kicker -->
Underneath

<!-- block: architecture-title -->
Agents do the work; the harness owns the boundaries

<!-- block: decisions-label -->
Pure decisions, explicit effects

<!-- block: decisions-body -->
Two Python daemons observe GitHub and derive the next action from the current world. Domain logic stays free of I/O; adapters own processes, GitHub and persistence. Remote mutations go through an idempotent act layer so a restart does not blindly repeat them.

<!-- block: money-label -->
Reserve before spending

<!-- block: money-body -->
SQLite is the authority for agent runs, leases and money. A paid run reserves its maximum charge in a transaction before it starts. Per-run, per-issue, daily and optional global limits include outstanding reservations, including when several agents run concurrently.

<!-- block: sandbox-label -->
Separate trust domains

<!-- block: sandbox-body -->
Each agent runs under Linux bubblewrap with its own checkout and private home. It cannot read the harness configuration, operator credentials or other repositories. The fixer gets a scoped GitHub token; the reviewer gets none. The harness submits the review under the separate reviewer identity.

<!-- block: results-kicker -->
Measured so far

<!-- block: results-title -->
One overnight run, not a benchmark

<!-- block: results-source -->
Reported in the project README for 14–15 October 2026, on a Tauri desktop app repository.

<!-- block: results-body -->
- **10 of 10 issues merged.**
- **About $5.60 per merged PR** on average, ranging from $0.40 to $37.80.
- **7 of 10 approved on the first review.**

Earlier batches were roughly $5–7 per merged PR. These are observations on my repositories, not a forecast for someone else’s. Costs are the harness’s token-based accounting at configured rates, rather than provider invoices.

<!-- block: limits-kicker -->
Still my responsibility

<!-- block: limits-title -->
A sandbox and a second opinion have limits

<!-- block: limits-body -->
An AI reviewer can miss a bad change. Agents can run commands and access the network inside their sandbox, and a hostile issue can still try to steer them. Reliable tests, branch protection and a development branch where a bad merge is cheap to undo are part of how I use it.

The harness stops with `needs-human` when intent is unclear, an issue looks like a duplicate, attempts run out or an issue reaches its spend limit. It still needs someone to answer those questions and decide what ships.

<!-- block: materials -->
Materials **Python, SQLite, bubblewrap, FastAPI, React / TypeScript**

<!-- block: status -->
Status **active · runs locally on Linux**

<!-- block: source -->
Source **[github/xnmp/autonomous-issue-agent](https://github.com/xnmp/autonomous-issue-agent)**
