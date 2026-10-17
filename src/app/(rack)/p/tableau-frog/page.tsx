import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import Image from "next/image";

const content = readContent("projects/tableau-frog");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function TableauFrogPage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="tableau-frog" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
            <Key href="/tableau-frog"><Markdown text={contentBlock(content, "the-showcase")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="tableau-frog" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "a-data-explorer-that-inverts-the-usual-workflow-you-never")} />
          </div>
          <div>
            <Screen art="/screens/tableau-frog.png" tone="olive" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "svelte-5")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "tauri-v2")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "154k-loc")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "2026-active")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-lens")} inline /></div>
            <h2><Markdown text={contentBlock(content, "enrichment-with-error-control")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-select-anywhere-see-everywhere")}
              caption={contentBlock(content, "caption-fig-1-a-brushed-selection-recolors-every-panel-by")}
            >
              <Image
                src="/tableau-frog/source-responders.webp"
                alt={contentBlock(content, "alt-tableau-frog-contrast-lens-showing-enrichment-across-l")}
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <Markdown text={contentBlock(content, "select-a-subset-on-any-panel-a-bar-a-brushed-range-a-cell")} paragraphStyle={{ marginTop: 20 }} />
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-assistant")} inline /></div>
            <h2><Markdown text={contentBlock(content, "ai-that-has-to-show-its-work")} inline /></h2>
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-hypothesis-cards")}
              caption={contentBlock(content, "caption-fig-2-investigate-mode-turns-a-selection-into-fals")}
            >
              <Image
                src="/tableau-frog/investigate-cards.webp"
                alt={contentBlock(content, "alt-ai-investigate-mode-generating-hypothesis-cards-from-a")}
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <Markdown text={contentBlock(content, "kbdctrl-i-on-a-selection-generates-hypotheses")} paragraphStyle={{ marginTop: 20 }} />
            <Features>
              <Feature label={contentBlock(content, "label-own-random-forest")}><Markdown text={contentBlock(content, "deterministic-zero-dependency-pure-ts-with-permutation-imp")} inline /></Feature>
              <Feature label={contentBlock(content, "label-plugin-charts")}><Markdown text={contentBlock(content, "a-documented-chartplugin-contract-on-window")} inline /></Feature>
              <Feature label={contentBlock(content, "label-eval-free-expressions")}><Markdown text={contentBlock(content, "log-zscore-bucket-ternary-parsed-and-computed-in-one-colum")} inline /></Feature>
              <Feature label={contentBlock(content, "label-domain-first")}><Markdown text={contentBlock(content, "27-pure-ts-modules-run-identically-in-a-plain-browser-the")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "open-questions")} inline /></h2>
          </div>
          <div>
            <OpenQuestion><Markdown text={contentBlock(content, "when-non-significant-differences-are-greyed-out-do-people")} inline /></OpenQuestion>
            <OpenQuestion label={contentBlock(content, "label-open-question-ii")}><Markdown text={contentBlock(content, "inferred-chart-kinds-remove-the-gallery-of-charts-decision")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialssvelte-5-typescript-tauri-v2")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintage2026-active")} inline /></div>
          <div><Markdown text={contentBlock(content, "scale1m-rows-100ms-29-unit-30-e2e-suites")} inline /></div>
          <div><Markdown text={contentBlock(content, "source-github-xnmp-tableau-frog-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="tableau-frog" />
    </>
  );
}
