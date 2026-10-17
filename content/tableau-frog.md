---
metadata:
  title: tableau-frog — the hacker's data explorer
  description: >-
    Keyboard-first, AI-native, variables-first data exploration. You don't pick
    charts — you pick variables. Brush any panel and every other recolours by
    significance-tested contrast. Built-in random forest, AI Investigate, a
    plugin API, 1M-row interactivity.
  openGraph:
    title: tableau-frog — the hacker's data explorer
    description: >-
      You don't pick charts. You pick variables. One global lens; every panel
      recolours by significance-tested contrast.
    type: website
  twitter:
    card: summary_large_image
    title: tableau-frog — the hacker's data explorer
    description: You don't pick charts. You pick variables.
shot: /tableau-frog
ledger:
  - title: Inferred charts
    body: >-
      Assign columns to **x / y / z** and `inferChartKind` derives the family
      from the axis type signature — scatter, clusters, line, histogram, bar,
      distribution, crosstab. You never open a chart-type menu.
  - title: One global lens
    body: >-
      Brush, click a bar, drag a lineX, click a crosstab cell — it all becomes
      one **Selection**. Shift composes with AND; the chip pops the newest
      clause; Esc clears all.
  - title: Significance-aware contrast
    body: >-
      Per-panel `ratio` vs `significant` metric. The latter greys out any group
      whose enrichment isn't statistically real — two-proportion z-test against
      the *complement*, then Benjamini-Hochberg FDR.
  - title: 'Missing values, first-class'
    body: >-
      The sidebar shows ∅ counts; bar / crosstab / distribution render a
      selectable `(missing)` bucket; a `missing` selection makes null-ness
      itself a lens.
  - title: Command palette
    key: ⌘⇧P
    body: >-
      A fuzzy, validity-gated command list makes the app fully
      keyboard-drivable. **Quick open** (Ctrl+P) is a noun-first jump to a
      column, saved lens, or dataset — a leading `>` delegates to commands.
  - title: Derived columns
    key: ƒx
    body: >-
      An eval-free expression engine: a hand-written tokenizer feeds a Pratt
      parser to a typed AST that compiles to a single linear pass over the
      columnar arrays — a 1M-row derive stays one scan.
  - title: Saved lenses
    body: >-
      Name a selection, stash it per dataset, re-apply later — validated against
      the current schema, installed as a global lens so every panel renders it
      as contrast.
  - title: Correlation overview
    body: >-
      A pairwise-complete Pearson-r heatmap over the numeric columns on a
      diverging visualMap pinned to r ∈ [-1, 1]; click a cell to spawn that
      scatter.
  - title: Plugin API + scripting
    body: >-
      `registerChartPlugin` claims axis-type signatures ahead of built-in
      inference; everything is on `window.tableauFrog` for console-driven
      automation.
grammar:
  - code: log(price)
    desc: natural log · numeric/temporal
  - code: zscore(age)
    desc: standardise against the column
  - code: year(signup_date)
    desc: temporal → numeric part
  - code: 'bucket(revenue, 10)'
    desc: quantise into N buckets
  - code: 'clamp(x, 0, 1)'
    desc: min/max fence
  - code: 'contains(name, "pro")'
    desc: string predicate → boolean
stats:
  - value: '*<100* ms'
    label: mask + contrast + build at 1M rows — brush→recolour stays interactive
  - value: ≈*0.4* s
    label: '36k-row random forest, trained from scratch in the browser'
  - value: '*355*'
    label: Vitest unit tests over the pure domain layer
  - value: '*67*'
    label: Playwright e2e tests driving the real pipeline — no mocking
---
<!-- block: 1 -->
1

<!-- block: 2 -->
2

<!-- block: tableauspan-frog-class-frog -->
tableau:span[ frog]{class="frog"}

<!-- block: demo -->
demo

<!-- block: investigate -->
investigate

<!-- block: hack-it -->
hack it

<!-- block: notebook -->
← notebook

<!-- block: keyboard-first-ai-native-variables-first -->
keyboard-first · ai-native · variables-first

<!-- block: headline -->
You don’t pick charts.\
You pick :span[variables.]{class="em"}

<!-- block: tableau-frog-is-a-data-explorer-for-people-who-d-rather-ty -->
**tableau-frog** is a data explorer for people who’d rather type than click. Assign columns to :span[x / y / z]{variant="ink"} slots and the chart is inferred. Brush any panel and one global :span[lens]{variant="ink"} recolours every other panel by statistical contrast — over-represented in red, under in blue, and **every colour is significance-tested**.

<!-- block: linkbrush-the-live-demo-href-demo-class-tf-btn-primary-lin -->
:link[brush the live demo ↓]{href="#demo" class="tf-btn primary"}:link[git clone & run]{href="#quickstart" class="tf-btn"}:span[or press :span[?]{class="tf-kbd"}]{variant="keyboard-hint"}

<!-- block: span01-class-idx-the-lens-live -->
:span[01]{class="idx"} the lens, live

<!-- block: this-isn-t-a-video -->
This isn’t a video. :span[Drag a box.]{class="em"}

<!-- block: 2-000-synthetic-signups-with-a-cohort-hiding-in-them -->
2,000 synthetic signups with a cohort hiding in them. The scatter is the source panel — brush a region and the responder panels recolour by real log-ratio prevalence, each group two-proportion z-tested with a Benjamini-Hochberg correction. Try the dense high-session cloud.

<!-- block: span02-class-idx-one-lens-every-panel -->
:span[02]{class="idx"} one lens, every panel

<!-- block: colours-you-can-trust -->
Colours you can trust.\
:span[Every contrast is significance-tested.]

<!-- block: the-source-panel-keeps-population-colours-with-an-accent-r -->
The source panel keeps population colours with an accent ring; every responder colours its groups by prevalence log-ratio, clamped to ±ln 4 so a 2× lift reads half-saturated. Switch a panel to :code[significant]{variant="yellow"} mode and groups whose enrichment isn’t statistically real fade to neutral gray. Shift-brush composes; the chip pops the newest clause; :span[Esc]{class="tf-kbd"} clears.

<!-- block: alt-one-brushed-source-panel-the-other-panels-recolour-by -->
One brushed source panel; the other panels recolour by contrast on a blue–gray–red diverging scale.

<!-- block: span03-class-idx-the-shape-of-it -->
:span[03]{class="idx"} the shape of it

<!-- block: nine-things-no-chart-picker -->
Nine things, no chart picker.

<!-- block: span04-class-idx-ai-investigate-ctrl-i -->
:span[04]{class="idx"} ai investigate · Ctrl+I

<!-- block: point-at-something-odd -->
Point at something odd. :span[Get falsifiable cards.]{class="em"}

<!-- block: investigate-is-the-bidirectional-counterpart-to-the-assist -->
Investigate is the bidirectional counterpart to the assistant: brush a notable subset, and the model returns 2–4 hypotheses — each with concrete, one-click test projections and a stated expectation, grounded strictly in significance-aware contrast stats. Apply, then mark each confirmed or rejected. The verdict trail persists.

<!-- block: brush-generate-hypotheses -->
Brush → generate hypotheses

<!-- block: a-brushed-cohort-becomes-the-lens -->
A brushed cohort becomes the lens. Hit :span[Ctrl+I]{class="tf-kbd"} and cards appear in a side drawer, ranked by confidence and carrying the contrast that motivated them.

<!-- block: alt-ai-investigate-drawer-hypothesis-cards-with-confidence -->
AI Investigate drawer: hypothesis cards with confidence badges and applyable test projections.

<!-- block: span-pro-plan-users-drive-the-enriched-cohort-high-class-t -->
:span[“Pro-plan users drive the enriched cohort” · HIGH]{class="tf-callout red"}:span[test → panel x:plan · y:age]{class="tf-callout"}:span[test → lens: plan = pro]{class="tf-callout aqua"}

<!-- block: apply-the-tests-confirm-or-reject -->
Apply the tests → confirm or reject

<!-- block: each-test-spawns-real-panels-tagged-codeh1-test-style-colo -->
Each test spawns real panels tagged :code[H1 test]{variant="yellow"}, edits the lens, or trains a model — applied in dependency order. The card’s border colours with your verdict; the trail is saved per dataset.

<!-- block: alt-applied-hypothesis-tests-spawned-panels-tagged-h1-test -->
Applied hypothesis tests: spawned panels tagged H1 test with the lens narrowed to pro-plan rows.

<!-- block: alt-natural-language-bar-turning-a-request-into-panels-and -->
Natural-language bar turning a request into panels and a lens.

<!-- block: span05-class-idx-ai-assistant-ctrl-j -->
:span[05]{class="idx"} ai assistant · Ctrl+J

<!-- block: natural-language-grounded-in-the-real-stats -->
Natural language, grounded in the real stats.

<!-- block: the-assistant-summarises-your-dataset-to-shape-only-types -->
The assistant summarises your dataset to *shape only* — types, ranges, capped category counts, row count; **never a row of data leaves** — then returns a validated plan of panels, a composed lens, and derived columns. “Explain selection” answers from the actual contrast summaries, not a hallucinated story.

<!-- block: spanshape-only-schema-no-rows-class-tf-callout-aqua-spanst -->
:span[shape-only schema · no rows]{class="tf-callout aqua"}:span[strict JSON output · validatePlan]{class="tf-callout"}:span[explain grounded in p / q]{class="tf-callout red"}

<!-- block: span06-class-idx-built-in-ml-no-dependencies -->
:span[06]{class="idx"} built-in ml · no dependencies

<!-- block: a-random-forest-that-trains-in-your-browser -->
A random forest that trains in your browser.

<!-- block: codemodel-predict-column-style-color-var-blue-grows-a-from -->
:code[model: predict <column>]{variant="blue"} grows a from-scratch, deterministic random forest over the columnar arrays — histogram-binned splits, seeded mulberry32 for reproducibility — then explains it with permutation importance and Friedman partial-dependence curves. 36k rows in ≈0.4 s. No data leaves the tab.

<!-- block: alt-permutation-feature-importance-bars-sorted-summing-to -->
Permutation feature-importance bars, sorted, summing to one.

<!-- block: alt-partial-dependence-curve-for-the-top-feature -->
Partial-dependence curve for the top feature.

<!-- block: alt-pairwise-complete-pearson-correlation-matrix-as-a-dive -->
Pairwise-complete Pearson correlation matrix as a diverging heatmap.

<!-- block: span07-class-idx-a-scripting-seam-on-purpose -->
:span[07]{class="idx"} a scripting seam, on purpose

<!-- block: hack-it-2 -->
Hack it.

<!-- block: everything-is-exposed-at-runtime-on-codewindow -->
Everything is exposed at runtime on :code[window.tableauFrog]{variant="aqua"}. Claim an axis-type signature with a chart plugin, or just drive the live app from the console.

<!-- block: derived-column-grammar-eval-free-pratt-parser -->
derived-column grammar · eval-free Pratt parser

<!-- block: span08-class-idx-the-numbers-precisely -->
:span[08]{class="idx"} the numbers, precisely

<!-- block: no-superlatives -->
No superlatives. Just measurements.

<!-- block: span09-class-idx-open-source-style-quickstart -->
:span[09]{class="idx"} open-source-style quickstart

<!-- block: clone-it -->
Clone it. Run it.

<!-- block: a-tauri-v2-desktop-app-that-runs-identically-in-a-plain-br -->
A Tauri v2 desktop app that runs identically in a plain browser. Pure-TypeScript domain, ECharts on the SVG renderer, Rust only for the native file dialog.

<!-- block: spancsv-tsv-parquet-json-jsonl-clipboard-class-tf-callout -->
:span[CSV · TSV · Parquet · JSON · JSONL · clipboard]{class="tf-callout"}:span[Ctrl+P quick open]{class="tf-callout aqua"}:span[Ctrl+Shift+P palette]{class="tf-callout red"}

<!-- block: tableauspan-frog-style-color-var-aqua-a-variables-first-da -->
tableau:span[ frog]{variant="aqua"} — a variables-first data explorer.

<!-- block: showcase-built-on-the-notebook-press-span -->
Showcase built on [the notebook](/) · press :span[?]{class="tf-kbd"}


<!-- block: code -->
```js
// claim a new axis-type signature with a chart plugin
window.tableauFrog.registerChartPlugin({
  kind: "hexbin",
  matches: ({ x, y }) => x?.type === "numeric" && y?.type === "numeric",
  create: (dataset, axes) => new HexbinChart(dataset, axes),
  buildOption: (model) => ({ series: [{ type: "custom", /* … */ }] }),
});

// …or just script the live app from the console
const frog = window.tableauFrog;
frog.addPanel({ x: "age", y: "session_minutes" });
frog.setLens({ field: "plan", eq: "pro" });
frog.deriveColumn("ltv", "monthly_revenue * tenure_months");
```


<!-- block: quickstart -->
```bash
# variables-first, keyboard-first, AI-native
git clone git@github.com:you/tableau-frog.git
cd tableau-frog

bun install
bun run dev            # http://localhost:1420
bun run tauri dev      # native desktop shell
```

<!-- block: window-title-1 -->
tableau-frog — source panel + responders

<!-- block: window-title-2 -->
investigate — hypothesis cards

<!-- block: window-title-3 -->
investigate — applied test projections

<!-- block: window-title-4 -->
assistant — natural language → panels + lens

<!-- block: window-title-5 -->
model — permutation importance

<!-- block: window-title-6 -->
model — partial dependence

<!-- block: window-title-7 -->
correlations — pairwise-complete Pearson r
