import { bindBlock } from "@/lib/studio/bindings";
import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import Image from "next/image";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/tableau-frog"), "metadata");
}

export default function TableauFrogPage() {
  const content = readContent("projects/tableau-frog");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="tableau-frog" />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
            <Key href="/tableau-frog"><Markdown {...bindBlock(content, "the-showcase")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="tableau-frog" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "a-data-explorer-that-inverts-the-usual-workflow-you-never")} />
          </div>
          <div>
            <Screen art="/screens/tableau-frog.png" tone="olive" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "svelte-5")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "tauri-v2")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "154k-loc")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "2026-active")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-lens")} inline /></div>
            <h2><Markdown {...bindBlock(content, "enrichment-with-error-control")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-select-anywhere-see-everywhere")} figureBinding={bindBlock(content, "figure-fig-1-select-anywhere-see-everywhere").binding}
              caption={contentBlock(content, "caption-fig-1-a-brushed-selection-recolors-every-panel-by")} captionBinding={bindBlock(content, "caption-fig-1-a-brushed-selection-recolors-every-panel-by").binding}
            >
              <Image
                src="/tableau-frog/source-responders.webp"
                alt={contentBlock(content, "alt-tableau-frog-contrast-lens-showing-enrichment-across-l")}
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <Markdown {...bindBlock(content, "select-a-subset-on-any-panel-a-bar-a-brushed-range-a-cell")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-assistant")} inline /></div>
            <h2><Markdown {...bindBlock(content, "ai-that-has-to-show-its-work")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-hypothesis-cards")} figureBinding={bindBlock(content, "figure-fig-2-hypothesis-cards").binding}
              caption={contentBlock(content, "caption-fig-2-investigate-mode-turns-a-selection-into-fals")} captionBinding={bindBlock(content, "caption-fig-2-investigate-mode-turns-a-selection-into-fals").binding}
            >
              <Image
                src="/tableau-frog/investigate-cards.webp"
                alt={contentBlock(content, "alt-ai-investigate-mode-generating-hypothesis-cards-from-a")}
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <Markdown {...bindBlock(content, "kbdctrl-i-on-a-selection-generates-hypotheses")} paragraphStyle={{ marginTop: 20 }} />
            <Features>
              <Feature label={contentBlock(content, "label-own-random-forest")} labelBinding={bindBlock(content, "label-own-random-forest").binding}><Markdown {...bindBlock(content, "deterministic-zero-dependency-pure-ts-with-permutation-imp")} inline /></Feature>
              <Feature label={contentBlock(content, "label-plugin-charts")} labelBinding={bindBlock(content, "label-plugin-charts").binding}><Markdown {...bindBlock(content, "a-documented-chartplugin-contract-on-window")} inline /></Feature>
              <Feature label={contentBlock(content, "label-eval-free-expressions")} labelBinding={bindBlock(content, "label-eval-free-expressions").binding}><Markdown {...bindBlock(content, "log-zscore-bucket-ternary-parsed-and-computed-in-one-colum")} inline /></Feature>
              <Feature label={contentBlock(content, "label-domain-first")} labelBinding={bindBlock(content, "label-domain-first").binding}><Markdown {...bindBlock(content, "27-pure-ts-modules-run-identically-in-a-plain-browser-the")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown {...bindBlock(content, "when-non-significant-differences-are-greyed-out-do-people")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")} labelBinding={bindBlock(content, "label-open-question-ii").binding}><Markdown {...bindBlock(content, "inferred-chart-kinds-remove-the-gallery-of-charts-decision")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialssvelte-5-typescript-tauri-v2")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintage2026-active")} inline /></div>
          <div><Markdown {...bindBlock(content, "scale1m-rows-100ms-29-unit-30-e2e-suites")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-tableau-frog-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="tableau-frog" />
    </>
  );
}
