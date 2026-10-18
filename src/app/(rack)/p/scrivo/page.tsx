import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/scrivo"), "metadata");
}

export default function Page() {
  const content = readContent("projects/scrivo");

  const REPO = contentField<string>(content, "repo");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="scrivo" />}
        nav={
          <>
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
            <Key editableLabel href={REPO}><Markdown {...bindBlock(content, "github")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="scrivo" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "introduction")} />
          </div>
          <div>
            <Screen art="/screens/scrivo.png" tone="cyan" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "rust")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "tauri-2")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "codemirror-6")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown {...bindBlock(content, "two-surfaces-over-one-text-buffer")} inline /></h2>
            <Markdown {...bindBlock(content, "from-docs-architecture")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-reading-first-editing-when-i-need-to")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown {...bindBlock(content, "why-the-editor-cannot-reformat-your-file")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-keeping-the-markdown-i-wrote")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown {...bindBlock(content, "startup-against-real-typora")} inline /></h2>
            <Markdown {...bindBlock(content, "source-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-did-it-actually-open-faster")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-time-to-verified-first-viewport")} figureBinding={bindBlock(content, "figure-fig-1-time-to-verified-first-viewport").binding}
              caption={contentBlock(content, "caption-content-median-paired-rounds-scrivo-was-faster-in")} captionBinding={bindBlock(content, "caption-content-median-paired-rounds-scrivo-was-faster-in").binding}
            >
              <Markdown {...bindBlock(content, "code-file-app-window-content-medium-8-8-kb-typora-411-965")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "frames")} inline /></div>
            <h2><Markdown {...bindBlock(content, "the-two-reference-frames")} inline /></h2>
            <Markdown {...bindBlock(content, "these-are-the-files-in-bench-references-that-the-benchmark")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-scrivo-medium-md-1280-720")} figureBinding={bindBlock(content, "figure-fig-2-scrivo-medium-md-1280-720").binding}
              caption={contentBlock(content, "caption-reading-view-in-the-default-light-appearance-the-s")} captionBinding={bindBlock(content, "caption-reading-view-in-the-default-light-appearance-the-s").binding}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/scrivo-medium.webp" alt={contentBlock(content, "alt-scrivo-reading-view-of-the-benchmark-medium-document-a")} width={1280} height={720} loading="lazy" className="shot-img" />
            </Plate>
            <Plate
              figure={contentBlock(content, "figure-fig-3-typora-medium-md-1280-705-cropped")} figureBinding={bindBlock(content, "figure-fig-3-typora-medium-md-1280-705-cropped").binding}
              caption={contentBlock(content, "caption-same-file-in-typora-with-a-dark-theme-the-themes-d")} captionBinding={bindBlock(content, "caption-same-file-in-typora-with-a-dark-theme-the-themes-d").binding}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/typora-medium-crop.webp" alt={contentBlock(content, "alt-typora-showing-the-same-benchmark-document-in-a-dark-t")} width={1280} height={705} loading="lazy" className="shot-img" />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-did-not-pan-out-and-what-i-have-not-checked")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-the-less-tidy-bits")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialsrust-tauri-2-typescript-codemirror-6")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintagesept-2026-to-now")} inline /></div>
          <div><Markdown {...bindBlock(content, "statusactive")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-scrivo-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="scrivo" />
    </>
  );
}
