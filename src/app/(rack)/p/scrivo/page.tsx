import { bindBlock } from "@/lib/studio/bindings";
import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Key href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
            <Key href={REPO}><Markdown {...bindBlock(content, "github")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="scrivo" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "i-wanted-typora-s-way-of-writing-without-waiting-for-it-to")} />
            <Markdown {...bindBlock(content, "the-editor-is-built-so-it-cannot-rewrite-your-file")} />
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
            <Markdown {...bindBlock(content, "run-scrivo-notes")} />
            <Markdown {...bindBlock(content, "press-ctrl-e-and-the-editor-takes-over")} />
            <Markdown {...bindBlock(content, "it-also-has-tabs-a-command-palette-a-contents-sidebar-find")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown {...bindBlock(content, "why-the-editor-cannot-reformat-your-file")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "editors-built-on-prosemirror-milkdown-tiptap-parse-markdow")} />
            <Features>
              <Feature label={contentBlock(content, "label-text-is-the-source-of-truth")} labelBinding={bindBlock(content, "label-text-is-the-source-of-truth").binding}><Markdown {...bindBlock(content, "the-editor-draws-decorations-over-the-buffer")} inline /></Feature>
              <Feature label={contentBlock(content, "label-bom-and-line-endings-kept")} labelBinding={bindBlock(content, "label-bom-and-line-endings-kept").binding}><Markdown {...bindBlock(content, "src-domain-text-format")} inline /></Feature>
              <Feature label={contentBlock(content, "label-safe-by-construction")} labelBinding={bindBlock(content, "label-safe-by-construction").binding}><Markdown {...bindBlock(content, "the-renderer-builds-html-from-parse-events")} inline /></Feature>
              <Feature label={contentBlock(content, "label-crash-recovery-copy")} labelBinding={bindBlock(content, "label-crash-recovery-copy").binding}><Markdown {...bindBlock(content, "dirty-text-goes-to-a-private-recovery-file-in-app-data-wri")} inline /></Feature>
              <Feature label={contentBlock(content, "label-ports-and-adapters")} labelBinding={bindBlock(content, "label-ports-and-adapters").binding}><Markdown {...bindBlock(content, "src-domain-is-pure-typescript-with-no-dom-no-codemirror-vi")} inline /></Feature>
              <Feature label={contentBlock(content, "label-chunked-first-paint")} labelBinding={bindBlock(content, "label-chunked-first-paint").binding}><Markdown {...bindBlock(content, "the-renderer-reports-safe-block-boundaries")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown {...bindBlock(content, "startup-against-real-typora")} inline /></h2>
            <Markdown {...bindBlock(content, "source-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "bench-ab")} />
            <Markdown {...bindBlock(content, "measured-on-2026-09-27-with-release-commit-129cd13-typora")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-time-to-verified-first-viewport")} figureBinding={bindBlock(content, "figure-fig-1-time-to-verified-first-viewport").binding}
              caption={contentBlock(content, "caption-content-median-paired-rounds-scrivo-was-faster-in")} captionBinding={bindBlock(content, "caption-content-median-paired-rounds-scrivo-was-faster-in").binding}
            >
              <Markdown {...bindBlock(content, "code-file-app-window-content-medium-8-8-kb-typora-411-965")} />
            </Plate>
            <Markdown {...bindBlock(content, "scrivo-s-time-barely-moves-with-file-size-because-the-firs")} />
            <Markdown {...bindBlock(content, "the-repo-has-58-commits-between-2026-09-26-and-2026-10-05")} />
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
            <Markdown {...bindBlock(content, "several-startup-experiments-came-back-as-noise-and-the-rea")} />
            <ul>
              <li><Markdown {...bindBlock(content, "mixed-line-endings-get-normalised-to-the-dominant-one-on-s")} inline /></li>
              <li><Markdown {...bindBlock(content, "recovery-writes-are-asynchronous")} inline /></li>
              <li><Markdown {...bindBlock(content, "obsidian-theme-import-covers-css-variables-only")} inline /></li>
              <li><Markdown {...bindBlock(content, "i-have-only-benchmarked-on-linux-with-typora-1")} inline /></li>
            </ul>
            <OpenQuestion><Markdown {...bindBlock(content, "typora-does-more-than-scrivo-does-so-part-of-that-gap-may")} inline /></OpenQuestion>
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
