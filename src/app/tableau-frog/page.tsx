import type { Metadata } from "next";
import Link from "next/link";
import "./tf.css";
import { mono, display, serif } from "./fonts";
import LensDemo from "./LensDemo";
import KeyboardLayer from "./KeyboardLayer";
import { Reveal } from "./Reveal";
import { Window } from "./Window";

export const metadata: Metadata = {
  title: "tableau-frog — the hacker's data explorer",
  description:
    "Keyboard-first, AI-native, variables-first data exploration. You don't pick charts — you pick variables. Brush any panel and every other recolours by significance-tested contrast. Built-in random forest, AI Investigate, a plugin API, 1M-row interactivity.",
  metadataBase: new URL("https://chong.md"),
  openGraph: {
    title: "tableau-frog — the hacker's data explorer",
    description:
      "You don't pick charts. You pick variables. One global lens; every panel recolours by significance-tested contrast.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tableau-frog — the hacker's data explorer",
    description: "You don't pick charts. You pick variables.",
  },
};

const SHOT = "/tableau-frog";

export default function TableauFrogPage() {
  return (
    <div className={`tf-root ${mono.variable} ${display.variable} ${serif.variable}`}>
      <KeyboardLayer />

      {/* ---------- nav ---------- */}
      <header className="tf-nav" id="tf-top">
        <span className="tf-brand">
          tableau<span className="frog"> frog</span>
        </span>
        <nav className="tf-nav-right">
          <a href="#demo">demo</a>
          <a href="#investigate">investigate</a>
          <a href="#hack">hack it</a>
          <Link href="/">← notebook</Link>
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section className="tf-wrap tf-hero">
        <Reveal>
          <div className="tf-kicker">keyboard-first · ai-native · variables-first</div>
          <h1 className="tf-h1">
            You don&rsquo;t pick charts.
            <br />
            You pick <span className="em">variables.</span>
          </h1>
          <p className="tf-lede">
            <b>tableau-frog</b>{" "}is a data explorer for people who&rsquo;d rather type than click. Assign
            columns to <span style={{ color: "var(--ink)" }}>x / y / z</span> slots and the chart is
            inferred. Brush any panel and one global <span style={{ color: "var(--ink)" }}>lens</span>{" "}
            recolours every other panel by statistical contrast — over-represented in red, under in blue,
            and <b>every colour is significance-tested</b>.
          </p>
          <div className="tf-hero-cta">
            <a className="tf-btn primary" href="#demo">brush the live demo ↓</a>
            <a className="tf-btn" href="#quickstart">git clone &amp; run</a>
            <span style={{ color: "var(--ink-3)", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
              or press <span className="tf-kbd">?</span>
            </span>
          </div>
        </Reveal>
      </section>

      {/* ---------- live demo ---------- */}
      <section className="tf-wrap tf-section" id="demo">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">01</span> the lens, live</div>
          <h2 className="tf-h2">This isn&rsquo;t a video. <span className="em">Drag a box.</span></h2>
          <p className="tf-sub">
            2,000 synthetic signups with a cohort hiding in them. The scatter is the source panel — brush a
            region and the responder panels recolour by real log-ratio prevalence, each group two-proportion
            z-tested with a Benjamini-Hochberg correction. Try the dense high-session cloud.
          </p>
        </div>
        <Reveal y={24}>
          <LensDemo />
        </Reveal>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="tf-wrap tf-section" id="lens">
        <div className="tf-quickstart">
          <Reveal>
            <div>
              <div className="tf-eyebrow"><span className="idx">02</span> one lens, every panel</div>
              <p className="tf-quote">
                Colours you can trust.
                <br />
                <span>Every contrast is significance-tested.</span>
              </p>
              <p className="tf-sub" style={{ marginTop: 22 }}>
                The source panel keeps population colours with an accent ring; every responder colours its
                groups by prevalence log-ratio, clamped to ±ln 4 so a 2× lift reads half-saturated. Switch a
                panel to <code style={{ color: "var(--yellow)" }}>significant</code> mode and groups whose
                enrichment isn&rsquo;t statistically real fade to neutral gray. Shift-brush composes; the chip
                pops the newest clause; <span className="tf-kbd">Esc</span> clears.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1} y={24}>
            <Window
              src={`${SHOT}/source-responders.webp`}
              alt="One brushed source panel; the other panels recolour by contrast on a blue–gray–red diverging scale."
              title="tableau-frog — source panel + responders"
              width={1400}
              height={875}
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- feature ledger ---------- */}
      <section className="tf-wrap tf-section">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">03</span> the shape of it</div>
          <h2 className="tf-h2">Nine things, no chart picker.</h2>
        </div>
        <div className="tf-ledger">
          {LEDGER.map((row) => (
            <Reveal key={row.title} y={10}>
              <div className="tf-ledger-row">
                <h4>
                  {row.title}
                  {row.key && <span className="tf-kbd key">{row.key}</span>}
                </h4>
                <p dangerouslySetInnerHTML={{ __html: row.body }} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- investigate story ---------- */}
      <section className="tf-wrap tf-section" id="investigate">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">04</span> ai investigate · Ctrl+I</div>
          <h2 className="tf-h2">Point at something odd. <span className="em">Get falsifiable cards.</span></h2>
          <p className="tf-sub">
            Investigate is the bidirectional counterpart to the assistant: brush a notable subset, and the
            model returns 2–4 hypotheses — each with concrete, one-click test projections and a stated
            expectation, grounded strictly in significance-aware contrast stats. Apply, then mark each
            confirmed or rejected. The verdict trail persists.
          </p>
        </div>

        <div className="tf-seq">
          <Reveal className="tf-seq-step" y={14}>
            <div className="tf-seq-num active">1</div>
            <div className="tf-seq-body">
              <h3>Brush → generate hypotheses</h3>
              <p>
                A brushed cohort becomes the lens. Hit <span className="tf-kbd">Ctrl+I</span> and cards appear
                in a side drawer, ranked by confidence and carrying the contrast that motivated them.
              </p>
              <Window
                src={`${SHOT}/investigate-cards.webp`}
                alt="AI Investigate drawer: hypothesis cards with confidence badges and applyable test projections."
                title="investigate — hypothesis cards"
                width={1400}
                height={875}
              />
              <div className="tf-callouts">
                <span className="tf-callout red">&ldquo;Pro-plan users drive the enriched cohort&rdquo; · HIGH</span>
                <span className="tf-callout">test → panel x:plan · y:age</span>
                <span className="tf-callout aqua">test → lens: plan = pro</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="tf-seq-step" y={14} delay={0.05}>
            <div className="tf-seq-num active">2</div>
            <div className="tf-seq-body">
              <h3>Apply the tests → confirm or reject</h3>
              <p>
                Each test spawns real panels tagged <code style={{ color: "var(--yellow)" }}>H1 test</code>,
                edits the lens, or trains a model — applied in dependency order. The card&rsquo;s border
                colours with your verdict; the trail is saved per dataset.
              </p>
              <Window
                src={`${SHOT}/investigate-applied.webp`}
                alt="Applied hypothesis tests: spawned panels tagged H1 test with the lens narrowed to pro-plan rows."
                title="investigate — applied test projections"
                width={1400}
                height={875}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- assistant ---------- */}
      <section className="tf-wrap tf-section" id="assistant">
        <div className="tf-quickstart">
          <Reveal y={24}>
            <Window
              src={`${SHOT}/ai-nl.webp`}
              alt="Natural-language bar turning a request into panels and a lens."
              title="assistant — natural language → panels + lens"
              width={1400}
              height={875}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <div className="tf-eyebrow"><span className="idx">05</span> ai assistant · Ctrl+J</div>
              <h2 className="tf-h2">Natural language, grounded in the real stats.</h2>
              <p className="tf-sub" style={{ marginTop: 16 }}>
                The assistant summarises your dataset to <i>shape only</i> — types, ranges, capped category
                counts, row count; <b>never a row of data leaves</b> — then returns a validated plan of
                panels, a composed lens, and derived columns. &ldquo;Explain selection&rdquo; answers from the
                actual contrast summaries, not a hallucinated story.
              </p>
              <div className="tf-callouts" style={{ marginTop: 18 }}>
                <span className="tf-callout aqua">shape-only schema · no rows</span>
                <span className="tf-callout">strict JSON output · validatePlan</span>
                <span className="tf-callout red">explain grounded in p / q</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- ML ---------- */}
      <section className="tf-wrap tf-section" id="ml">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">06</span> built-in ml · no dependencies</div>
          <h2 className="tf-h2">A random forest that trains in your browser.</h2>
          <p className="tf-sub">
            <code style={{ color: "var(--blue)" }}>model: predict &lt;column&gt;</code> grows a from-scratch,
            deterministic random forest over the columnar arrays — histogram-binned splits, seeded
            mulberry32 for reproducibility — then explains it with permutation importance and Friedman
            partial-dependence curves. 36k rows in ≈0.4 s. No data leaves the tab.
          </p>
        </div>
        <div className="tf-quickstart">
          <Reveal y={16}>
            <Window
              src={`${SHOT}/ml-importance.webp`}
              alt="Permutation feature-importance bars, sorted, summing to one."
              title="model — permutation importance"
              width={447}
              height={320}
              sizes="(max-width: 880px) 100vw, 560px"
            />
          </Reveal>
          <Reveal y={16} delay={0.08}>
            <Window
              src={`${SHOT}/ml-pdp.webp`}
              alt="Partial-dependence curve for the top feature."
              title="model — partial dependence"
              width={447}
              height={320}
              sizes="(max-width: 880px) 100vw, 560px"
            />
          </Reveal>
        </div>
        <Reveal y={16}>
          <div style={{ marginTop: 20 }}>
            <Window
              src={`${SHOT}/correlation.webp`}
              alt="Pairwise-complete Pearson correlation matrix as a diverging heatmap."
              title="correlations — pairwise-complete Pearson r"
              width={1400}
              height={875}
              sizes="(max-width: 880px) 100vw, 1100px"
            />
          </div>
        </Reveal>
      </section>

      {/* ---------- hack it ---------- */}
      <section className="tf-wrap tf-section" id="hack">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">07</span> a scripting seam, on purpose</div>
          <h2 className="tf-h2">Hack it.</h2>
          <p className="tf-sub">
            Everything is exposed at runtime on <code style={{ color: "var(--aqua)" }}>window.tableauFrog</code>.
            Claim an axis-type signature with a chart plugin, or just drive the live app from the console.
          </p>
        </div>
        <Reveal y={16}>
          <div className="tf-code">
            <pre>
              <code dangerouslySetInnerHTML={{ __html: CODE }} />
            </pre>
          </div>
        </Reveal>
        <Reveal y={12}>
          <div style={{ marginTop: 20 }}>
            <div className="tf-eyebrow" style={{ marginBottom: 12 }}>
              derived-column grammar · eval-free Pratt parser
            </div>
            <div className="tf-grammar">
              {GRAMMAR.map((g) => (
                <div key={g.code}>
                  <code>{g.code}</code>
                  <span>{g.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- stats strip ---------- */}
      <section className="tf-wrap tf-section" id="stats">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><span className="idx">08</span> the numbers, precisely</div>
          <h2 className="tf-h2">No superlatives. Just measurements.</h2>
        </div>
        <Reveal y={14}>
          <div className="tf-stats">
            {STATS.map((s) => (
              <div className="tf-stat" key={s.label}>
                <div className="v" dangerouslySetInnerHTML={{ __html: s.value }} />
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- quickstart ---------- */}
      <section className="tf-wrap tf-section" id="quickstart">
        <div className="tf-quickstart">
          <Reveal>
            <div>
              <div className="tf-eyebrow"><span className="idx">09</span> open-source-style quickstart</div>
              <h2 className="tf-h2">Clone it. Run it.</h2>
              <p className="tf-sub" style={{ marginTop: 16 }}>
                A Tauri v2 desktop app that runs identically in a plain browser. Pure-TypeScript domain, ECharts
                on the SVG renderer, Rust only for the native file dialog.
              </p>
              <div className="tf-callouts" style={{ marginTop: 18 }}>
                <span className="tf-callout">CSV · TSV · Parquet · JSON · JSONL · clipboard</span>
                <span className="tf-callout aqua">Ctrl+P quick open</span>
                <span className="tf-callout red">Ctrl+Shift+P palette</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08} y={16}>
            <div className="tf-code">
              <pre>
                <code dangerouslySetInnerHTML={{ __html: QUICKSTART }} />
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="tf-wrap tf-footer">
        <span>
          tableau<span style={{ color: "var(--aqua)" }}> frog</span> — a variables-first data explorer.
        </span>
        <span>
          Showcase built on <Link href="/">the notebook</Link> · press <span className="tf-kbd">?</span>
        </span>
      </footer>
    </div>
  );
}

/* ---------- static content ---------- */

const LEDGER: Array<{ title: string; key?: string; body: string }> = [
  {
    title: "Inferred charts",
    body: "Assign columns to <b>x / y / z</b> and <code>inferChartKind</code> derives the family from the axis type signature — scatter, clusters, line, histogram, bar, distribution, crosstab. You never open a chart-type menu.",
  },
  {
    title: "One global lens",
    body: "Brush, click a bar, drag a lineX, click a crosstab cell — it all becomes one <b>Selection</b>. Shift composes with AND; the chip pops the newest clause; Esc clears all.",
  },
  {
    title: "Significance-aware contrast",
    body: "Per-panel <code>ratio</code> vs <code>significant</code> metric. The latter greys out any group whose enrichment isn't statistically real — two-proportion z-test against the <i>complement</i>, then Benjamini-Hochberg FDR.",
  },
  {
    title: "Missing values, first-class",
    body: "The sidebar shows ∅ counts; bar / crosstab / distribution render a selectable <code>(missing)</code> bucket; a <code>missing</code> selection makes null-ness itself a lens.",
  },
  {
    title: "Command palette",
    key: "⌘⇧P",
    body: "A fuzzy, validity-gated command list makes the app fully keyboard-drivable. <b>Quick open</b> (Ctrl+P) is a noun-first jump to a column, saved lens, or dataset — a leading <code>&gt;</code> delegates to commands.",
  },
  {
    title: "Derived columns",
    key: "ƒx",
    body: "An eval-free expression engine: a hand-written tokenizer feeds a Pratt parser to a typed AST that compiles to a single linear pass over the columnar arrays — a 1M-row derive stays one scan.",
  },
  {
    title: "Saved lenses",
    body: "Name a selection, stash it per dataset, re-apply later — validated against the current schema, installed as a global lens so every panel renders it as contrast.",
  },
  {
    title: "Correlation overview",
    body: "A pairwise-complete Pearson-r heatmap over the numeric columns on a diverging visualMap pinned to r ∈ [-1, 1]; click a cell to spawn that scatter.",
  },
  {
    title: "Plugin API + scripting",
    body: "<code>registerChartPlugin</code> claims axis-type signatures ahead of built-in inference; everything is on <code>window.tableauFrog</code> for console-driven automation.",
  },
];

const GRAMMAR: Array<{ code: string; desc: string }> = [
  { code: "log(price)", desc: "natural log · numeric/temporal" },
  { code: "zscore(age)", desc: "standardise against the column" },
  { code: "year(signup_date)", desc: "temporal → numeric part" },
  { code: "bucket(revenue, 10)", desc: "quantise into N buckets" },
  { code: "clamp(x, 0, 1)", desc: "min/max fence" },
  { code: 'contains(name, "pro")', desc: "string predicate → boolean" },
];

const STATS: Array<{ value: string; label: string }> = [
  { value: "<em>&lt;100</em> ms", label: "mask + contrast + build at 1M rows — brush→recolour stays interactive" },
  { value: "≈<em>0.4</em> s", label: "36k-row random forest, trained from scratch in the browser" },
  { value: "<em>355</em>", label: "Vitest unit tests over the pure domain layer" },
  { value: "<em>67</em>", label: "Playwright e2e tests driving the real pipeline — no mocking" },
];

/* syntax-highlighted code (hand-tagged spans matching the app's palette) */
const CODE = [
  '<span class="cm">// claim a new axis-type signature with a chart plugin</span>',
  '<span class="fn">window</span>.<span class="fn">tableauFrog</span>.<span class="fn">registerChartPlugin</span>(<span class="pn">{</span>',
  '  <span class="pn">kind</span>: <span class="str">"hexbin"</span>,',
  '  <span class="pn">matches</span>: <span class="pn">(</span><span class="pn">{ x, y }</span><span class="pn">)</span> <span class="op">=&gt;</span> x?.type <span class="op">===</span> <span class="str">"numeric"</span> <span class="op">&amp;&amp;</span> y?.type <span class="op">===</span> <span class="str">"numeric"</span>,',
  '  <span class="pn">create</span>: <span class="pn">(</span>dataset, axes<span class="pn">)</span> <span class="op">=&gt;</span> <span class="kw">new</span> <span class="fn">HexbinChart</span>(dataset, axes),',
  '  <span class="pn">buildOption</span>: <span class="pn">(</span>model<span class="pn">)</span> <span class="op">=&gt;</span> <span class="pn">({</span> series: [<span class="pn">{</span> type: <span class="str">"custom"</span>, <span class="cm">/* … */</span> <span class="pn">}</span>] <span class="pn">})</span>,',
  '<span class="pn">}</span>);',
  "",
  '<span class="cm">// …or just script the live app from the console</span>',
  '<span class="kw">const</span> frog <span class="op">=</span> <span class="fn">window</span>.<span class="fn">tableauFrog</span>;',
  'frog.<span class="fn">addPanel</span>(<span class="pn">{</span> x: <span class="str">"age"</span>, y: <span class="str">"session_minutes"</span> <span class="pn">}</span>);',
  'frog.<span class="fn">setLens</span>(<span class="pn">{</span> field: <span class="str">"plan"</span>, eq: <span class="str">"pro"</span> <span class="pn">}</span>);',
  'frog.<span class="fn">deriveColumn</span>(<span class="str">"ltv"</span>, <span class="str">"monthly_revenue * tenure_months"</span>);',
].join("\n");

const QUICKSTART = [
  '<span class="cm"># variables-first, keyboard-first, AI-native</span>',
  '<span class="fn">git</span> clone git@github.com:you/tableau-frog.git',
  '<span class="fn">cd</span> tableau-frog',
  "",
  '<span class="fn">bun</span> install',
  '<span class="fn">bun</span> run dev            <span class="cm"># http://localhost:1420</span>',
  '<span class="fn">bun</span> run tauri dev      <span class="cm"># native desktop shell</span>',
].join("\n");
