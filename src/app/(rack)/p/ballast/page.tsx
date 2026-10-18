import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/ballast"), "metadata");
}

export default function Page() {
  const content = readContent("projects/ballast");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="ballast" />}
        nav={
          <>
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="ballast" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "introduction")} />
          </div>
          <div>
            <Screen art="/screens/ballast.png" tone="olive" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "svelte-5")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "tauri-2")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "kotlin")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "local-first")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown {...bindBlock(content, "daylio-s-loop-minus-the-account")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-the-bit-i-wanted-to-keep-from-daylio")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-data")} inline /></div>
            <h2><Markdown {...bindBlock(content, "one-file-per-entry")} inline /></h2>
            <Markdown {...bindBlock(content, "layout-from-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-ballastdata")} figureBinding={bindBlock(content, "figure-fig-1-ballastdata").binding}
              caption={contentBlock(content, "caption-the-filename-is-the-authority-on-when-an-entry-hap")} captionBinding={bindBlock(content, "caption-the-filename-is-the-authority-on-when-an-entry-hap").binding}
            >
              <Markdown {...bindBlock(content, "code-ballastdata-entries-2026-07-27-1005-md-activities-jso")} />
            </Plate>
            <Markdown {...bindBlock(content, "moods-are-stored-by-name-so-a-grep-for-mood-awful-works")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown {...bindBlock(content, "treating-the-files-as-something-other-tools-will-edit")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-the-app-isnt-the-only-thing-touching-them")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-the-last-release-recorded")} inline /></h2>
            <Markdown {...bindBlock(content, "from-docs-handover-2026-10-02-release")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-making-it-smaller")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "the-rewrite-that-cut-scope-and-what-is-unsettled")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-what-i-might-come-back-to")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialssvelte-5-tauri-2-rust-kotlin")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintagejuly-2026-to-now")} inline /></div>
          <div><Markdown {...bindBlock(content, "statusactive-v0")} inline /></div>
          <div><Markdown {...bindBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="ballast" />
    </>
  );
}
