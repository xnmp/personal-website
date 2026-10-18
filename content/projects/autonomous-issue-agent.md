---
slug: autonomous-issue-agent
glyph: 工
title: Issue Agent
summary: "My local harness for handing issues to coding agents and a separate reviewer."
heading: "Letting the agents work through my issue queue"
href: /p/autonomous-issue-agent
repo: https://github.com/xnmp/autonomous-issue-agent
tags:
  - python
  - claude / codex
  - sqlite
  - react
index: "My coding-agent harness · issue queue, review and spend limits"
stats:
  - "Local harness"
  - "Separate reviewer"
  - "Spend limits"
art: /screens/autonomous-issue-agent.png
status: producing
shelf: tools
tone: amber
metadata:
  title: "Issue Agent · chong"
  description: "Trying to hand small fixes to coding agents without supervising every command, with a separate reviewer and a local dashboard."
order: 12
---

<!-- block: all-projects -->
← all projects

<!-- block: github -->
Source on GitHub

<!-- block: headline -->
Letting the agents work through my issue queue

<!-- block: introduction -->
I wanted to hand off small fixes without supervising every command. The idea here is that I label an issue `ai-ready`, an agent works on it, and a separate agent reviews the change. Failed checks or review comments send it back for another attempt.

It runs on my Linux machine against my repositories. Approved changes go to a development branch. I still decide what reaches production.

<!-- block: workflow-kicker -->
The loop

<!-- block: workflow-title -->
What happens after I label an issue

<!-- block: workflow-body -->
A planning pass writes down what done should mean and estimates the difficulty. The fixer gets its own checkout. When it opens a PR, the harness waits for CI and asks a different agent to review it. The review is submitted under a separate GitHub identity.

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
Which issues need me?

<!-- block: dashboard-body -->
The dashboard puts questions and stuck issues ahead of work that's still running. I can look at the attempts, cost and history without following every agent terminal. The screenshots below use fixture issues, not live work.

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
What I want the harness to keep track of

<!-- block: body-what-i-want-the-harness-to-keep-track-of -->
### Restarts

The next action is derived from GitHub and local state. Remote writes go through an idempotent layer, so restarting the harness doesn't blindly repeat them.

### Spending

A run reserves its maximum charge in SQLite before starting. Limits include runs still in flight, which matters when several agents are working at once.

### What an agent can see

Each agent gets a checkout and private home inside a bubblewrap sandbox. The fixer has a scoped GitHub token. The reviewer doesn't hold one; the harness submits its review.

<!-- block: results-kicker -->
Measured so far

<!-- block: results-title -->
One overnight run

<!-- block: results-source -->
Reported in the project README for 14–15 October 2026, on a Tauri desktop app repository.

<!-- block: results-body -->
The README records ten issues merged overnight on 14–15 October 2026, at an average accounted cost of about $5.60 per PR. Seven passed their first review. One cost $37.80.

That's useful experience on one of my repositories, but too small a sample to know what a typical issue will cost. These are the harness's token-cost estimates, not provider invoices.

<!-- block: limits-kicker -->
The bits I still own

<!-- block: limits-title -->
A second agent can miss things too

<!-- block: limits-body -->
A separate AI reviewer can still approve a bad change. The sandbox limits what the agents can reach, but they can run commands and use the network inside it. I still need useful tests and a development branch where mistakes are recoverable.

Unclear intent, exhausted attempts and spend limits end in `needs-human`. The queue still has questions I need to answer; the aim is to spend less time supervising the mechanical parts.

<!-- block: materials -->
Materials **Python, SQLite, bubblewrap, FastAPI, React / TypeScript**

<!-- block: status -->
Status **active · runs locally on Linux**

<!-- block: source -->
Source **[github/xnmp/autonomous-issue-agent](https://github.com/xnmp/autonomous-issue-agent)**
