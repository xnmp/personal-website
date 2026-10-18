---
slug: tableau-frog
glyph: 蛙
title: Tableau Frog
summary: "An experiment in exploring data by choosing variables and comparing subsets."
heading: "Trying a different way to look at data"
href: /p/tableau-frog
repo: 'https://github.com/xnmp/tableau-frog'
tags:
  - svelte 5
  - statistics
  - echarts
  - "data exploration"
index: "Data exploration · linked charts · AI experiments"
stats:
  - "Linked charts"
  - "Local data"
  - "AI experiments"
art: /screens/tableau-frog.png
status: producing
shelf: tools
tone: olive
metadata:
  title: "Tableau Frog · chong"
  description: "An experiment with variable-driven charts, linked selections and AI-assisted questions about a dataset."
order: 5
---
<!-- block: all-projects -->
← all projects

<!-- block: the-showcase -->
Screenshots and examples →

<!-- block: headline -->
Trying a different way to look at data

<!-- block: a-data-explorer-that-inverts-the-usual-workflow-you-never -->
The idea I'm playing with is choosing the variables first and letting the app work out a chart. Then, when I select an interesting group in one panel, I can see how that group differs across the others.

Tableau Frog is where I've been trying out that interaction, along with some ways of getting an AI to help explore the data.

<!-- block: svelte-5 -->
svelte 5

<!-- block: tauri-v2 -->
tauri v2

<!-- block: 154k-loc -->
data exploration

<!-- block: 2026-active -->
2026, active

<!-- block: the-lens -->
Comparing subsets

<!-- block: enrichment-with-error-control -->
What stands out about this group?

<!-- block: figure-fig-1-select-anywhere-see-everywhere -->
FIG. 1 · Select anywhere, see everywhere

<!-- block: caption-fig-1-a-brushed-selection-recolors-every-panel-by -->
Selecting a subset updates the other panels. A significance mode uses a two-proportion z-test and false-discovery-rate correction to mute some of the noisier differences.

<!-- block: alt-tableau-frog-contrast-lens-showing-enrichment-across-l -->
Tableau Frog contrast lens showing enrichment across linked panels

<!-- block: select-a-subset-on-any-panel-a-bar-a-brushed-range-a-cell -->
I can click a bar, brush a range or select a cell, then compare that subset with the rest of the data. Shift adds another condition. The selections are saved per dataset. A lot of the implementation work is keeping those updates responsive as the dataset grows.

<!-- block: the-assistant -->
Asking questions

<!-- block: ai-that-has-to-show-its-work -->
Using the AI suggestions as things to investigate

<!-- block: figure-fig-2-hypothesis-cards -->
FIG. 2 · Hypothesis cards

<!-- block: caption-fig-2-investigate-mode-turns-a-selection-into-fals -->
Investigate suggests hypotheses and a view that could test each one. The verdicts are recorded with the dataset.

<!-- block: alt-ai-investigate-mode-generating-hypothesis-cards-from-a -->
AI Investigate mode generating hypothesis cards from a data selection

<!-- block: kbdctrl-i-on-a-selection-generates-hypotheses -->
Ctrl+I asks for hypotheses about a selection. Each suggestion comes with a projection to try, and I can record whether it held up. The model receives dataset metadata such as column names, types and summary counts, rather than raw rows. That still means the metadata is sent to an external model.

<!-- block: deterministic-zero-dependency-pure-ts-with-permutation-imp -->
There's a random forest written in TypeScript, with feature importance and partial-dependence views. It's another way to look for relationships in the same dataset.

<!-- block: label-own-random-forest -->
A local model

<!-- block: a-documented-chartplugin-contract-on-window -->
Extra chart types can register through `window.tableauFrog`. That gives the experiment somewhere to grow without putting every chart into the core.

<!-- block: label-plugin-charts -->
Other chart types

<!-- block: log-zscore-bucket-ternary-parsed-and-computed-in-one-colum -->
Derived columns support things like log, z-score and bucketing. The expressions are parsed, rather than passed to JavaScript's eval.

<!-- block: label-eval-free-expressions -->
Derived columns

<!-- block: 27-pure-ts-modules-run-identically-in-a-plain-browser-the -->
Most of the app runs in a browser. The Tauri shell adds desktop file access.

<!-- block: label-domain-first -->
Browser and desktop

<!-- block: the-rough-edges -->
Still figuring it out

<!-- block: open-questions -->
Does this make exploration easier?

<!-- block: when-non-significant-differences-are-greyed-out-do-people -->
I'm not sure whether muting differences helps someone read a chart, or makes the remaining colours look more conclusive than they are. Statistical significance doesn't establish why a difference exists.

<!-- block: inferred-chart-kinds-remove-the-gallery-of-charts-decision -->
Inferring a chart saves a choice until it infers the wrong one. I still need to work out how much manual control belongs alongside that.

<!-- block: label-open-question-ii -->
Open question II

<!-- block: materialssvelte-5-typescript-tauri-v2 -->
Materials**Svelte 5, TypeScript, Tauri v2**

<!-- block: vintage2026-active -->
Vintage**2026, active**

<!-- block: scale1m-rows-100ms-29-unit-30-e2e-suites -->
Notes**Linked selections, local models and AI-assisted exploration**

<!-- block: source-github-xnmp-tableau-frog-https-github -->
Source **[github/xnmp/tableau-frog ](https://github.com/xnmp/tableau-frog)**
