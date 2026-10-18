---
metadata:
  title: "Tableau Frog · experiments and screenshots"
  description: "An interactive selection example and notes from my data-exploration project."
  openGraph:
    title: "Tableau Frog · experiments and screenshots"
    description: "Linked charts, variable-driven views and some AI experiments."
    type: website
  twitter:
    card: summary_large_image
    title: "Tableau Frog · experiments and screenshots"
    description: "Linked charts, variable-driven views and some AI experiments."
shot: /tableau-frog
ledger:
  - title: Inferred charts
    body: "Assign columns to x, y and z. The app infers a chart from the types of those columns."
  - title: One global lens
    body: >-
      Brush, click a bar, drag a lineX, click a crosstab cell — it all becomes
      one **Selection**. Shift composes with AND; the chip pops the newest
      clause; Esc clears all.
  - title: "Statistical filtering"
    body: "Significant mode uses a two-proportion z-test against the complement and Benjamini–Hochberg correction. Passing the threshold isn't a guarantee that a difference is important or causal."
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
    label: "Recorded mask, contrast and chart-build time at 1M rows"
  - value: ≈*0.4* s
    label: "Recorded random-forest run on 36k rows in the browser"
  - value: "*Browser*"
    label: "Most of the exploration runs without the desktop shell"
  - value: "*Desktop*"
    label: "Tauri adds native file access"
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
data exploration experiments

<!-- block: headline -->
Some experiments with :span[data exploration]{class="em"}

<!-- block: tableau-frog-is-a-data-explorer-for-people-who-d-rather-ty -->
This is a closer look at Tableau Frog, a project where I've been trying variable-driven charts and linked selections. There's a small interactive example below, followed by screenshots and notes from the app.

<!-- block: linkbrush-the-live-demo-href-demo-class-tf-btn-primary-lin -->
:link[try the selection example ↓]{href="#demo" class="tf-btn primary"}:link[run it locally]{href="#quickstart" class="tf-btn"}

<!-- block: span01-class-idx-the-lens-live -->
:span[01]{class="idx"} the lens, live

<!-- block: this-isn-t-a-video -->
Try selecting a group

<!-- block: 2-000-synthetic-signups-with-a-cohort-hiding-in-them -->
The example uses 2,000 synthetic signups. Drag a box in the scatter plot to select some of them, then watch how the other panels change. The colours compare that subset with the population; a statistical filter mutes some of the noisier differences.

<!-- block: span02-class-idx-one-lens-every-panel -->
:span[02]{class="idx"} one lens, every panel

<!-- block: colours-you-can-trust -->
Comparing the selection with the rest

<!-- block: the-source-panel-keeps-population-colours-with-an-accent-r -->
The source panel keeps its original colours and marks the selection. The other panels show relative prevalence. In significant mode, a two-proportion z-test and Benjamini–Hochberg correction mute differences that don't pass the threshold. This is an exploratory aid, not evidence of a cause. Shift adds another condition; Esc clears the selection.

<!-- block: alt-one-brushed-source-panel-the-other-panels-recolour-by -->
One brushed source panel; the other panels recolour by contrast on a blue–gray–red diverging scale.

<!-- block: span03-class-idx-the-shape-of-it -->
:span[03]{class="idx"} the shape of it

<!-- block: nine-things-no-chart-picker -->
Some of the pieces in the app

<!-- block: span04-class-idx-ai-investigate-ctrl-i -->
:span[04]{class="idx"} ai investigate · Ctrl+I

<!-- block: point-at-something-odd -->
Questions to investigate

<!-- block: investigate-is-the-bidirectional-counterpart-to-the-assist -->
Investigate asks a model for possible explanations of a selection. Each suggestion includes a view or calculation to try. I can apply those suggestions and record a verdict with the dataset. The suggestions still need checking.

<!-- block: brush-generate-hypotheses -->
Brush → generate hypotheses

<!-- block: a-brushed-cohort-becomes-the-lens -->
After selecting a group, Ctrl+I opens the hypothesis drawer. These screenshots show the proposed questions and the views suggested for checking them.

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
Asking for a view in words

<!-- block: the-assistant-summarises-your-dataset-to-shape-only-types -->
The assistant receives metadata such as column names, types, ranges, category counts and row counts. Raw rows are excluded, but the metadata is sent to an external model. It can propose panels, selections and derived columns. An explanation is still a model-generated interpretation that needs checking against the data.

<!-- block: spanshape-only-schema-no-rows-class-tf-callout-aqua-spanst -->
:span[metadata sent to the model]{class="tf-callout aqua"}:span[validated panel plans]{class="tf-callout"}

<!-- block: span06-class-idx-built-in-ml-no-dependencies -->
:span[06]{class="idx"} built-in ml · no dependencies

<!-- block: a-random-forest-that-trains-in-your-browser -->
A local random forest

<!-- block: codemodel-predict-column-style-color-var-blue-grows-a-from -->
:code[model: predict <column>]{variant="blue"} trains a TypeScript random forest in the browser. Feature importance and partial-dependence views give another way to inspect relationships. This local modelling step doesn't send the dataset to a model service.

<!-- block: alt-permutation-feature-importance-bars-sorted-summing-to -->
Permutation feature-importance bars, sorted, summing to one.

<!-- block: alt-partial-dependence-curve-for-the-top-feature -->
Partial-dependence curve for the top feature.

<!-- block: alt-pairwise-complete-pearson-correlation-matrix-as-a-dive -->
Pairwise-complete Pearson correlation matrix as a diverging heatmap.

<!-- block: span07-class-idx-a-scripting-seam-on-purpose -->
:span[07]{class="idx"} a scripting seam, on purpose

<!-- block: hack-it-2 -->
Trying other chart types

<!-- block: everything-is-exposed-at-runtime-on-codewindow -->
The app exposes :code[window.tableauFrog]{variant="aqua"} for experiments from the console. A chart plugin can register another way to display an axis-type combination.

<!-- block: derived-column-grammar-eval-free-pratt-parser -->
derived-column grammar · eval-free Pratt parser

<!-- block: span08-class-idx-the-numbers-precisely -->
:span[08]{class="idx"} the numbers, precisely

<!-- block: no-superlatives -->
A couple of recorded timings

<!-- block: span09-class-idx-open-source-style-quickstart -->
:span[09]{class="idx"} open-source-style quickstart

<!-- block: clone-it -->
Running the project

<!-- block: a-tauri-v2-desktop-app-that-runs-identically-in-a-plain-br -->
Most of the app runs in a plain browser. The Tauri desktop shell adds native file access. The source has setup instructions and notes on the implementation.

<!-- block: spancsv-tsv-parquet-json-jsonl-clipboard-class-tf-callout -->
:span[CSV · TSV · Parquet · JSON · JSONL · clipboard]{class="tf-callout"}:span[Ctrl+P quick open]{class="tf-callout aqua"}:span[Ctrl+Shift+P palette]{class="tf-callout red"}

<!-- block: tableauspan-frog-style-color-var-aqua-a-variables-first-da -->
tableau:span[ frog]{variant="aqua"} — notes and experiments.

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
# Run the browser version locally
git clone https://github.com/xnmp/tableau-frog.git
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
