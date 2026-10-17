---
slug: tableau-frog
glyph: 蛙
title: Tableau Frog
heading: Point at a difference; it tells you if it’s real.
href: /p/tableau-frog
repo: 'https://github.com/xnmp/tableau-frog'
tags:
  - svelte 5
  - statistics
  - echarts
  - ai-native
index: Variables-first data explorer · contrast lens with FDR correction
stats:
  - 1M rows <100ms
  - z-test + FDR
  - 59 suites
art: /screens/tableau-frog.png
status: producing
shelf: tools
tone: olive
metadata:
  title: 'Tableau Frog: point at a difference, learn if it''s real'
  description: >-
    A keyboard-first, variables-first data explorer: a statistically rigorous
    contrast lens (z-test + FDR), a from-scratch random forest, and an AI
    Investigate mode that emits falsifiable hypotheses.
order: 5
---
<!-- block: all-projects -->
← all projects

<!-- block: the-showcase -->
the showcase →

<!-- block: headline -->
Point at a difference; it tells you if it’s real.

<!-- block: a-data-explorer-that-inverts-the-usual-workflow-you-never -->
A data explorer that inverts the usual workflow: you never pick a chart type. You assign variables to axis slots and the chart kind is inferred. Then the contrast lens does the part dashboards skip, deciding statistically which differences deserve color.

<!-- block: svelte-5 -->
svelte 5

<!-- block: tauri-v2 -->
tauri v2

<!-- block: 154k-loc -->
~154k LoC

<!-- block: 2026-active -->
2026, active

<!-- block: the-lens -->
The lens

<!-- block: enrichment-with-error-control -->
Enrichment, with error control

<!-- block: figure-fig-1-select-anywhere-see-everywhere -->
FIG. 1 · Select anywhere, see everywhere

<!-- block: caption-fig-1-a-brushed-selection-recolors-every-panel-by -->
Fig. 1: a brushed selection recolors every panel by enrichment against the population; a two-proportion z-test with Benjamini–Hochberg correction greys out what isn't significant.

<!-- block: alt-tableau-frog-contrast-lens-showing-enrichment-across-l -->
Tableau Frog contrast lens showing enrichment across linked panels

<!-- block: select-a-subset-on-any-panel-a-bar-a-brushed-range-a-cell -->
Select a subset on any panel (a bar, a brushed range, a cell) and every other panel becomes a comparison against the population. Lenses compose with Shift (gestures AND together), persist per dataset, and stay under 100ms end-to-end at a million rows: the mask intersection runs in-place on typed arrays, 18ms for an AND of two selections.

<!-- block: the-assistant -->
The assistant

<!-- block: ai-that-has-to-show-its-work -->
AI that has to show its work

<!-- block: figure-fig-2-hypothesis-cards -->
FIG. 2 · Hypothesis cards

<!-- block: caption-fig-2-investigate-mode-turns-a-selection-into-fals -->
Fig. 2: Investigate mode turns a selection into falsifiable hypothesis cards, each with a one-click test projection and a persisted verdict trail.

<!-- block: alt-ai-investigate-mode-generating-hypothesis-cards-from-a -->
AI Investigate mode generating hypothesis cards from a data selection

<!-- block: kbdctrl-i-on-a-selection-generates-hypotheses -->
:kbd[Ctrl+I] on a selection generates hypotheses. Each one is phrased so the data can prove it wrong, has a one-click projection that tests it, and gets its verdict recorded per dataset. The privacy line is enforced by the architecture rather than by policy: only shape metadata (column names, types, cardinalities) ever reaches the model; raw rows cannot leave the machine, and the API key is stored outside the exportable config.

<!-- block: deterministic-zero-dependency-pure-ts-with-permutation-imp -->
Deterministic, zero-dependency, pure TS, with permutation importance, partial dependence, and OOB accuracy.

<!-- block: label-own-random-forest -->
Own random forest

<!-- block: a-documented-chartplugin-contract-on-window -->
A documented `ChartPlugin` contract on `window.tableauFrog`; custom chart kinds register at runtime.

<!-- block: label-plugin-charts -->
Plugin charts

<!-- block: log-zscore-bucket-ternary-parsed-and-computed-in-one-colum -->
log, zscore, bucket, ternary, parsed and computed in one columnar pass.

<!-- block: label-eval-free-expressions -->
Eval-free expressions

<!-- block: 27-pure-ts-modules-run-identically-in-a-plain-browser-the -->
27 pure-TS modules run identically in a plain browser; the Rust shell only opens files.

<!-- block: label-domain-first -->
Domain-first

<!-- block: the-rough-edges -->
The rough edges

<!-- block: open-questions -->
Open questions

<!-- block: when-non-significant-differences-are-greyed-out-do-people -->
When non-significant differences are greyed out, do people stop exploring, or start trusting what stays lit? The honest version of this tool needs a study, not a hunch.

<!-- block: inferred-chart-kinds-remove-the-gallery-of-charts-decision -->
Inferred chart kinds remove the gallery-of-charts decision. But power users eventually want to override the inference. Where does the variables-first grammar put that escape hatch without becoming the menu it replaced?

<!-- block: label-open-question-ii -->
Open question II

<!-- block: materialssvelte-5-typescript-tauri-v2 -->
Materials**Svelte 5, TypeScript, Tauri v2**

<!-- block: vintage2026-active -->
Vintage**2026, active**

<!-- block: scale1m-rows-100ms-29-unit-30-e2e-suites -->
Scale**1M rows < 100ms · 29 unit + 30 e2e suites**

<!-- block: source-github-xnmp-tableau-frog-https-github -->
Source **[github/xnmp/tableau-frog ](https://github.com/xnmp/tableau-frog)**
