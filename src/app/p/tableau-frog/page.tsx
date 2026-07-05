import Link from "next/link";
import Image from "next/image";
import {
  RunningHead,
  Divider,
  Tags,
  Tag,
  OpenQuestion,
  Plate,
  Features,
  Feature,
  Folio,
  PageBackground,
} from "@/components/notebook";

export const metadata = {
  title: "Tableau Frog — Chong",
  description:
    "A keyboard-first, variables-first data explorer: a statistically rigorous contrast lens (z-test + FDR), a from-scratch random forest, and an AI Investigate mode that emits falsifiable hypotheses.",
};

export default function TableauFrogPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-2.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry IV &nbsp;·&nbsp; Tableau Frog &nbsp;·&nbsp; filed under{" "}
            <span className="filed">tools · statistics</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <Link href="/tableau-frog">the interactive showcase →</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 04 · Entry IV</div>
          <h1>Point at a difference; it tells you if it&rsquo;s real.</h1>
          <p>
            A data explorer that inverts the usual workflow: you never pick a
            chart type — assign variables to axis slots and the chart kind is
            inferred. Then the contrast lens does the part dashboards skip:
            it decides, statistically, which differences deserve color.
          </p>
        </div>
        <Tags>
          <Tag>svelte 5</Tag>
          <Tag>tauri v2</Tag>
          <Tag>~154k LoC</Tag>
          <Tag>MMXXVI — active</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — The lens</div>
          <h3>Enrichment, with error control</h3>
        </div>
        <div>
          <Plate
            figure="FIG. I — Select anywhere, see everywhere"
            caption="Fig. I — a brushed selection recolors every panel by enrichment against the population; a two-proportion z-test with Benjamini–Hochberg correction greys out what isn't significant."
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
            Select a subset on any panel — a bar, a brushed range, a cell —
            and every other panel becomes a comparison against the
            population. Lenses compose with Shift (gestures AND together),
            persist per dataset, and stay under 100ms end-to-end at a million
            rows: the mask intersection runs in-place on typed arrays, 18ms
            for an AND of two selections.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ II&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — The assistant</div>
          <h3>AI that has to show its work</h3>
        </div>
        <div>
          <Plate
            figure="FIG. II — Hypothesis cards"
            caption="Fig. II — Investigate mode turns a selection into falsifiable hypothesis cards, each with a one-click test projection and a persisted verdict trail."
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
            <code>Ctrl+I</code> on a selection generates hypotheses — each one
            phrased so the data can prove it wrong, each with a one-click
            projection that tests it, each verdict recorded per dataset. The
            privacy line is architectural, not a policy: only shape metadata
            (column names, types, cardinalities) ever reaches the model; raw
            rows cannot leave the machine, and the API key is stored outside
            the exportable config.
          </p>
          <Features>
            <Feature label="Own random forest">
              Deterministic, zero-dependency, pure TS — with permutation
              importance, partial dependence, and OOB accuracy.
            </Feature>
            <Feature label="Plugin charts">
              A documented <code>ChartPlugin</code> contract on{" "}
              <code>window.tableauFrog</code> — custom chart kinds register at
              runtime.
            </Feature>
            <Feature label="Eval-free expressions">
              log, zscore, bucket, ternary — parsed and computed in one
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
          <div className="section-kicker">§ III — The rough edges</div>
          <h3>Open questions</h3>
        </div>
        <div>
          <OpenQuestion>
            When non-significant differences are greyed out, do people stop
            exploring — or start trusting what stays lit? The honest version
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
          Vintage<strong>MMXXVI — active</strong>
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

      <Folio number="4" />
    </>
  );
}
