import Image from "next/image";
import {
  RunningHead,
  Tags,
  Tag,
  OpenQuestion,
  Plate,
  Features,
  Feature,
  Folio,
} from "@/components/notebook";
import { Cap, Screen, Key } from "@/components/rack";

export const metadata = {
  title: "Tableau Frog: point at a difference, learn if it's real",
  description:
    "A keyboard-first, variables-first data explorer: a statistically rigorous contrast lens (z-test + FDR), a from-scratch random forest, and an AI Investigate mode that emits falsifiable hypotheses.",
};

export default function TableauFrogPage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            05 &nbsp;·&nbsp; Tableau Frog &nbsp;·&nbsp; <span className="filed">active</span>
          </>
        }
        nav={
          <>
            <Key href="/">← all projects</Key>
            <Key href="/tableau-frog">the showcase →</Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <div className="kicker">05 · Tableau Frog</div>
            <h1>Point at a difference; it tells you if it’s real.</h1>
            <p>
              A data explorer that inverts the usual workflow: you never pick a
              chart type. You assign variables to axis slots and the chart kind is
              inferred. Then the contrast lens does the part dashboards skip,
              deciding statistically which differences deserve color.
            </p>
          </div>
          <div>
            <Screen art="/screens/tableau-frog.png" tone="olive" />
            <Tags>
              <Tag>svelte 5</Tag>
              <Tag>tauri v2</Tag>
              <Tag>~154k LoC</Tag>
              <Tag>2026, active</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The lens</div>
            <h2>Enrichment, with error control</h2>
          </div>
          <div>
            <Plate
              figure="FIG. 1 · Select anywhere, see everywhere"
              caption="Fig. 1: a brushed selection recolors every panel by enrichment against the population; a two-proportion z-test with Benjamini–Hochberg correction greys out what isn't significant."
            >
              <Image
                src="/tableau-frog/source-responders.webp"
                alt="Tableau Frog contrast lens showing enrichment across linked panels"
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <p style={{ marginTop: 20 }}>
              Select a subset on any panel (a bar, a brushed range, a cell)
              and every other panel becomes a comparison against the
              population. Lenses compose with Shift (gestures AND together),
              persist per dataset, and stay under 100ms end-to-end at a million
              rows: the mask intersection runs in-place on typed arrays, 18ms
              for an AND of two selections.
            </p>
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker">The assistant</div>
            <h2>AI that has to show its work</h2>
          </div>
          <div>
            <Plate
              figure="FIG. 2 · Hypothesis cards"
              caption="Fig. 2: Investigate mode turns a selection into falsifiable hypothesis cards, each with a one-click test projection and a persisted verdict trail."
            >
              <Image
                src="/tableau-frog/investigate-cards.webp"
                alt="AI Investigate mode generating hypothesis cards from a data selection"
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <p style={{ marginTop: 20 }}>
              <Cap inline>Ctrl+I</Cap> on a selection generates hypotheses. Each one is
              phrased so the data can prove it wrong, has a one-click
              projection that tests it, and gets its verdict recorded per dataset. The
              privacy line is enforced by the architecture rather than by policy: only shape metadata
              (column names, types, cardinalities) ever reaches the model; raw
              rows cannot leave the machine, and the API key is stored outside
              the exportable config.
            </p>
            <Features>
              <Feature label="Own random forest">
                Deterministic, zero-dependency, pure TS, with permutation
                importance, partial dependence, and OOB accuracy.
              </Feature>
              <Feature label="Plugin charts">
                A documented <code>ChartPlugin</code> contract on{" "}
                <code>window.tableauFrog</code>; custom chart kinds register at
                runtime.
              </Feature>
              <Feature label="Eval-free expressions">
                log, zscore, bucket, ternary, parsed and computed in one
                columnar pass.
              </Feature>
              <Feature label="Domain-first">
                27 pure-TS modules run identically in a plain browser; the Rust
                shell only opens files.
              </Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The rough edges</div>
            <h2>Open questions</h2>
          </div>
          <div>
            <OpenQuestion>
              When non-significant differences are greyed out, do people stop
              exploring, or start trusting what stays lit? The honest version
              of this tool needs a study, not a hunch.
            </OpenQuestion>
            <OpenQuestion label="Open question II">
              Inferred chart kinds remove the gallery-of-charts decision. But
              power users eventually want to override the inference. Where does
              the variables-first grammar put that escape hatch without
              becoming the menu it replaced?
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Svelte 5, TypeScript, Tauri v2</strong>
          </div>
          <div>
            Vintage<strong>2026, active</strong>
          </div>
          <div>
            Scale<strong>1M rows &lt; 100ms · 29 unit + 30 e2e suites</strong>
          </div>
          <div>
            Source
            <strong>
              <a href="https://github.com/xnmp/tableau-frog">
                github/xnmp/tableau-frog
              </a>
            </strong>
          </div>
        </section>

      </main>
      <Folio number="05" />
    </>
  );
}
