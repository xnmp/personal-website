import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/scrivo");

const REPO = contentField<string>(content, "repo");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function Page() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="scrivo" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
            <Key href={REPO}><Markdown text={contentBlock(content, "github")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="scrivo" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "i-wanted-typora-s-way-of-writing-without-waiting-for-it-to")} />
            <Markdown text={contentBlock(content, "the-editor-is-built-so-it-cannot-rewrite-your-file")} />
          </div>
          <div>
            <Screen art="/screens/scrivo.png" tone="cyan" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "rust")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "tauri-2")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "codemirror-6")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown text={contentBlock(content, "two-surfaces-over-one-text-buffer")} inline /></h2>
            <Markdown text={contentBlock(content, "from-docs-architecture")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "run-scrivo-notes")} />
            <Markdown text={contentBlock(content, "press-ctrl-e-and-the-editor-takes-over")} />
            <Markdown text={contentBlock(content, "it-also-has-tabs-a-command-palette-a-contents-sidebar-find")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown text={contentBlock(content, "why-the-editor-cannot-reformat-your-file")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "editors-built-on-prosemirror-milkdown-tiptap-parse-markdow")} />
            <Features>
              <Feature label={contentBlock(content, "label-text-is-the-source-of-truth")}><Markdown text={contentBlock(content, "the-editor-draws-decorations-over-the-buffer")} inline /></Feature>
              <Feature label={contentBlock(content, "label-bom-and-line-endings-kept")}><Markdown text={contentBlock(content, "src-domain-text-format")} inline /></Feature>
              <Feature label={contentBlock(content, "label-safe-by-construction")}><Markdown text={contentBlock(content, "the-renderer-builds-html-from-parse-events")} inline /></Feature>
              <Feature label={contentBlock(content, "label-crash-recovery-copy")}><Markdown text={contentBlock(content, "dirty-text-goes-to-a-private-recovery-file-in-app-data-wri")} inline /></Feature>
              <Feature label={contentBlock(content, "label-ports-and-adapters")}><Markdown text={contentBlock(content, "src-domain-is-pure-typescript-with-no-dom-no-codemirror-vi")} inline /></Feature>
              <Feature label={contentBlock(content, "label-chunked-first-paint")}><Markdown text={contentBlock(content, "the-renderer-reports-safe-block-boundaries")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown text={contentBlock(content, "startup-against-real-typora")} inline /></h2>
            <Markdown text={contentBlock(content, "source-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "bench-ab")} />
            <Markdown text={contentBlock(content, "measured-on-2026-09-27-with-release-commit-129cd13-typora")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-time-to-verified-first-viewport")}
              caption={contentBlock(content, "caption-content-median-paired-rounds-scrivo-was-faster-in")}
            >
              <Markdown text={contentBlock(content, "code-file-app-window-content-medium-8-8-kb-typora-411-965")} />
            </Plate>
            <Markdown text={contentBlock(content, "scrivo-s-time-barely-moves-with-file-size-because-the-firs")} />
            <Markdown text={contentBlock(content, "the-repo-has-58-commits-between-2026-09-26-and-2026-10-05")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "frames")} inline /></div>
            <h2><Markdown text={contentBlock(content, "the-two-reference-frames")} inline /></h2>
            <Markdown text={contentBlock(content, "these-are-the-files-in-bench-references-that-the-benchmark")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-2-scrivo-medium-md-1280-720")}
              caption={contentBlock(content, "caption-reading-view-in-the-default-light-appearance-the-s")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/scrivo-medium.webp" alt={contentBlock(content, "alt-scrivo-reading-view-of-the-benchmark-medium-document-a")} width={1280} height={720} loading="lazy" className="shot-img" />
            </Plate>
            <Plate
              figure={contentBlock(content, "figure-fig-3-typora-medium-md-1280-705-cropped")}
              caption={contentBlock(content, "caption-same-file-in-typora-with-a-dark-theme-the-themes-d")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static capture */}
              <img src="/scrivo/typora-medium-crop.webp" alt={contentBlock(content, "alt-typora-showing-the-same-benchmark-document-in-a-dark-t")} width={1280} height={705} loading="lazy" className="shot-img" />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-did-not-pan-out-and-what-i-have-not-checked")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "several-startup-experiments-came-back-as-noise-and-the-rea")} />
            <ul>
              <li><Markdown text={contentBlock(content, "mixed-line-endings-get-normalised-to-the-dominant-one-on-s")} inline /></li>
              <li><Markdown text={contentBlock(content, "recovery-writes-are-asynchronous")} inline /></li>
              <li><Markdown text={contentBlock(content, "obsidian-theme-import-covers-css-variables-only")} inline /></li>
              <li><Markdown text={contentBlock(content, "i-have-only-benchmarked-on-linux-with-typora-1")} inline /></li>
            </ul>
            <OpenQuestion><Markdown text={contentBlock(content, "typora-does-more-than-scrivo-does-so-part-of-that-gap-may")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialsrust-tauri-2-typescript-codemirror-6")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintagesept-2026-to-now")} inline /></div>
          <div><Markdown text={contentBlock(content, "statusactive")} inline /></div>
          <div><Markdown text={contentBlock(content, "source-github-xnmp-scrivo-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="scrivo" />
    </>
  );
}
