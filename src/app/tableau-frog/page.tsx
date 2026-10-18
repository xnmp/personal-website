import { EditableText } from "@/components/studio/EditableText";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import { Markdown } from "@/components/notebook/Markdown";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import { EditableLink } from "@/components/studio/EditableLink";
import { display, mono, serif } from "./fonts";
import KeyboardLayer from "./KeyboardLayer";
import LensDemo from "./LensDemo";
import { Reveal } from "./Reveal";
import "./tf.css";
import { Window } from "./Window";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("tableau-frog"), "metadata");
}

export default function TableauFrogPage() {
  const content = readContent("tableau-frog");

  const SHOT = contentField<string>(content, "shot");

  /* ---------- static content ---------- */

  const LEDGER: Array<{ title: string; key?: string; body: string }> = contentField<Array<{ title: string; key?: string; body: string }>>(content, "ledger");

  const GRAMMAR: Array<{ code: string; desc: string }> = contentField<Array<{ code: string; desc: string }>>(content, "grammar");

  const STATS: Array<{ value: string; label: string }> = contentField<Array<{ value: string; label: string }>>(content, "stats");

  /* syntax-highlighted code (hand-tagged spans matching the app's palette) */

  return (
    <div className={`tf-root ${mono.variable} ${display.variable} ${serif.variable}`}>
      <KeyboardLayer />

      {/* ---------- nav ---------- */}
      <header className="tf-nav" id="tf-top">
        <span className="tf-brand"><Markdown {...bindBlock(content, "tableauspan-frog-class-frog")} inline /></span>
        <nav className="tf-nav-right">
          <EditableLink href="#demo"><Markdown {...bindBlock(content, "demo")} inline allowLinks={false} /></EditableLink>
          <EditableLink href="#investigate"><Markdown {...bindBlock(content, "investigate")} inline allowLinks={false} /></EditableLink>
          <EditableLink href="#hack"><Markdown {...bindBlock(content, "hack-it")} inline allowLinks={false} /></EditableLink>
          <EditableLink href="/"><Markdown {...bindBlock(content, "notebook")} inline allowLinks={false} /></EditableLink>
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section className="tf-wrap tf-hero">
        <Reveal>
          <div className="tf-kicker"><Markdown {...bindBlock(content, "keyboard-first-ai-native-variables-first")} inline /></div>
          <h1 className="tf-h1"><Markdown {...bindBlock(content, "headline")} inline /></h1>
          <Markdown {...bindBlock(content, "tableau-frog-is-a-data-explorer-for-people-who-d-rather-ty")} paragraphClassName="tf-lede" />
          <div className="tf-hero-cta"><Markdown {...bindBlock(content, "linkbrush-the-live-demo-href-demo-class-tf-btn-primary-lin")} inline /></div>
        </Reveal>
      </section>

      {/* ---------- live demo ---------- */}
      <section className="tf-wrap tf-section" id="demo">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span01-class-idx-the-lens-live")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "this-isn-t-a-video")} inline /></h2>
          <Markdown {...bindBlock(content, "2-000-synthetic-signups-with-a-cohort-hiding-in-them")} paragraphClassName="tf-sub" />
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
              <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span02-class-idx-one-lens-every-panel")} inline /></div>
              <Markdown {...bindBlock(content, "colours-you-can-trust")} paragraphClassName="tf-quote" />
              <Markdown {...bindBlock(content, "the-source-panel-keeps-population-colours-with-an-accent-r")} paragraphClassName="tf-sub" paragraphStyle={{ marginTop: 22 }} />
            </div>
          </Reveal>
          <Reveal delay={0.1} y={24}>
            <Window
              src={`${SHOT}/source-responders.webp`}
              alt={contentBlock(content, "alt-one-brushed-source-panel-the-other-panels-recolour-by")}
              title={contentBlock(content, "window-title-1")} titleBinding={bindBlock(content, "window-title-1").binding}
              width={1400}
              height={875}
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- feature ledger ---------- */}
      <section className="tf-wrap tf-section">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span03-class-idx-the-shape-of-it")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "nine-things-no-chart-picker")} inline /></h2>
        </div>
        <div className="tf-ledger">
          {LEDGER.map((row, index) => (
            <Reveal key={row.title} y={10}>
              <div className="tf-ledger-row">
                <h4>
                  <EditableText binding={bindField(content, ["ledger", index, "title"])}>{row.title}</EditableText>
                  {row.key && <span className="tf-kbd key"><EditableText binding={bindField(content, ["ledger", index, "key"])} format="plain">{row.key}</EditableText></span>}
                </h4>
                <Markdown text={row.body} binding={bindField(content, ["ledger", index, "body"])} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- investigate story ---------- */}
      <section className="tf-wrap tf-section" id="investigate">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span04-class-idx-ai-investigate-ctrl-i")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "point-at-something-odd")} inline /></h2>
          <Markdown {...bindBlock(content, "investigate-is-the-bidirectional-counterpart-to-the-assist")} paragraphClassName="tf-sub" />
        </div>

        <div className="tf-seq">
          <Reveal className="tf-seq-step" y={14}>
            <div className="tf-seq-num active"><Markdown {...bindBlock(content, "1")} inline /></div>
            <div className="tf-seq-body">
              <h3><Markdown {...bindBlock(content, "brush-generate-hypotheses")} inline /></h3>
              <Markdown {...bindBlock(content, "a-brushed-cohort-becomes-the-lens")} />
              <Window
                src={`${SHOT}/investigate-cards.webp`}
                alt={contentBlock(content, "alt-ai-investigate-drawer-hypothesis-cards-with-confidence")}
                title={contentBlock(content, "window-title-2")} titleBinding={bindBlock(content, "window-title-2").binding}
                width={1400}
                height={875}
              />
              <div className="tf-callouts"><Markdown {...bindBlock(content, "span-pro-plan-users-drive-the-enriched-cohort-high-class-t")} inline /></div>
            </div>
          </Reveal>

          <Reveal className="tf-seq-step" y={14} delay={0.05}>
            <div className="tf-seq-num active"><Markdown {...bindBlock(content, "2")} inline /></div>
            <div className="tf-seq-body">
              <h3><Markdown {...bindBlock(content, "apply-the-tests-confirm-or-reject")} inline /></h3>
              <Markdown {...bindBlock(content, "each-test-spawns-real-panels-tagged-codeh1-test-style-colo")} />
              <Window
                src={`${SHOT}/investigate-applied.webp`}
                alt={contentBlock(content, "alt-applied-hypothesis-tests-spawned-panels-tagged-h1-test")}
                title={contentBlock(content, "window-title-3")} titleBinding={bindBlock(content, "window-title-3").binding}
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
              alt={contentBlock(content, "alt-natural-language-bar-turning-a-request-into-panels-and")}
              title={contentBlock(content, "window-title-4")} titleBinding={bindBlock(content, "window-title-4").binding}
              width={1400}
              height={875}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span05-class-idx-ai-assistant-ctrl-j")} inline /></div>
              <h2 className="tf-h2"><Markdown {...bindBlock(content, "natural-language-grounded-in-the-real-stats")} inline /></h2>
              <Markdown {...bindBlock(content, "the-assistant-summarises-your-dataset-to-shape-only-types")} paragraphClassName="tf-sub" paragraphStyle={{ marginTop: 16 }} />
              <div className="tf-callouts" style={{ marginTop: 18 }}><Markdown {...bindBlock(content, "spanshape-only-schema-no-rows-class-tf-callout-aqua-spanst")} inline /></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- ML ---------- */}
      <section className="tf-wrap tf-section" id="ml">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span06-class-idx-built-in-ml-no-dependencies")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "a-random-forest-that-trains-in-your-browser")} inline /></h2>
          <Markdown {...bindBlock(content, "codemodel-predict-column-style-color-var-blue-grows-a-from")} paragraphClassName="tf-sub" />
        </div>
        <div className="tf-quickstart">
          <Reveal y={16}>
            <Window
              src={`${SHOT}/ml-importance.webp`}
              alt={contentBlock(content, "alt-permutation-feature-importance-bars-sorted-summing-to")}
              title={contentBlock(content, "window-title-5")} titleBinding={bindBlock(content, "window-title-5").binding}
              width={447}
              height={320}
              sizes="(max-width: 880px) 100vw, 560px"
            />
          </Reveal>
          <Reveal y={16} delay={0.08}>
            <Window
              src={`${SHOT}/ml-pdp.webp`}
              alt={contentBlock(content, "alt-partial-dependence-curve-for-the-top-feature")}
              title={contentBlock(content, "window-title-6")} titleBinding={bindBlock(content, "window-title-6").binding}
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
              alt={contentBlock(content, "alt-pairwise-complete-pearson-correlation-matrix-as-a-dive")}
              title={contentBlock(content, "window-title-7")} titleBinding={bindBlock(content, "window-title-7").binding}
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
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span07-class-idx-a-scripting-seam-on-purpose")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "hack-it-2")} inline /></h2>
          <Markdown {...bindBlock(content, "everything-is-exposed-at-runtime-on-codewindow")} paragraphClassName="tf-sub" />
        </div>
        <Reveal y={16}>
          <div className="tf-code">
            <Markdown {...bindBlock(content, "code")} />
          </div>
        </Reveal>
        <Reveal y={12}>
          <div style={{ marginTop: 20 }}>
            <div className="tf-eyebrow" style={{ marginBottom: 12 }}><Markdown {...bindBlock(content, "derived-column-grammar-eval-free-pratt-parser")} inline /></div>
            <div className="tf-grammar">
              {GRAMMAR.map((g, index) => (
                <div key={g.code}>
                  <code><EditableText binding={bindField(content, ["grammar", index, "code"])} format="plain">{g.code}</EditableText></code>
                  <span><EditableText binding={bindField(content, ["grammar", index, "desc"])}>{g.desc}</EditableText></span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- stats strip ---------- */}
      <section className="tf-wrap tf-section" id="stats">
        <div className="tf-section-head">
          <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span08-class-idx-the-numbers-precisely")} inline /></div>
          <h2 className="tf-h2"><Markdown {...bindBlock(content, "no-superlatives")} inline /></h2>
        </div>
        <Reveal y={14}>
          <div className="tf-stats">
            {STATS.map((s, index) => (
              <div className="tf-stat" key={s.label}>
                <div className="v"><Markdown text={s.value} binding={bindField(content, ["stats", index, "value"])} inline /></div>
                <div className="l"><EditableText binding={bindField(content, ["stats", index, "label"])}>{s.label}</EditableText></div>
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
              <div className="tf-eyebrow"><Markdown {...bindBlock(content, "span09-class-idx-open-source-style-quickstart")} inline /></div>
              <h2 className="tf-h2"><Markdown {...bindBlock(content, "clone-it")} inline /></h2>
              <Markdown {...bindBlock(content, "a-tauri-v2-desktop-app-that-runs-identically-in-a-plain-br")} paragraphClassName="tf-sub" paragraphStyle={{ marginTop: 16 }} />
              <div className="tf-callouts" style={{ marginTop: 18 }}><Markdown {...bindBlock(content, "spancsv-tsv-parquet-json-jsonl-clipboard-class-tf-callout")} inline /></div>
            </div>
          </Reveal>
          <Reveal delay={0.08} y={16}>
            <div className="tf-code">
              <Markdown {...bindBlock(content, "quickstart")} />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="tf-wrap tf-footer">
        <span><Markdown {...bindBlock(content, "tableauspan-frog-style-color-var-aqua-a-variables-first-da")} inline /></span>
        <span><Markdown {...bindBlock(content, "showcase-built-on-the-notebook-press-span")} inline /></span>
      </footer>
    </div>
  );
}
