import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/ballast");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function Page() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="ballast" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="ballast" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "the-tagline-in-the-readme-is-the-weight-that-keeps-a-ship")} />
            <Markdown text={contentBlock(content, "the-data-is-a-folder-of-files-i-can-grep-and-sync-with-syn")} />
          </div>
          <div>
            <Screen art="/screens/ballast.png" tone="olive" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "svelte-5")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "tauri-2")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "kotlin")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "local-first")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown text={contentBlock(content, "daylio-s-loop-minus-the-account")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "each-entry-has-a-timestamp-one-of-five-moods-rad-good-meh")} />
            <Markdown text={contentBlock(content, "the-bottom-nav-is-entries-a-plus-button-calendar-and-more")} />
            <Markdown text={contentBlock(content, "the-app-does-no-stats-goals-streaks-or-reminders")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-data")} inline /></div>
            <h2><Markdown text={contentBlock(content, "one-file-per-entry")} inline /></h2>
            <Markdown text={contentBlock(content, "layout-from-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "figure-fig-1-ballastdata")}
              caption={contentBlock(content, "caption-the-filename-is-the-authority-on-when-an-entry-hap")}
            >
              <Markdown text={contentBlock(content, "code-ballastdata-entries-2026-07-27-1005-md-activities-jso")} />
            </Plate>
            <Markdown text={contentBlock(content, "moods-are-stored-by-name-so-a-grep-for-mood-awful-works")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown text={contentBlock(content, "treating-the-files-as-something-other-tools-will-edit")} inline /></h2>
          </div>
          <div>
            <Features>
              <Feature label={contentBlock(content, "label-parsers-never-throw")}><Markdown text={contentBlock(content, "parseentry-in-src-lib-persistence-entryfile")} inline /></Feature>
              <Feature label={contentBlock(content, "label-staged-daylio-import")}><Markdown text={contentBlock(content, "scripts-import-real")} inline /></Feature>
              <Feature label={contentBlock(content, "label-ports-and-adapters")}><Markdown text={contentBlock(content, "a-pure-domain-a-framework-free-application-layer-and-one-s")} inline /></Feature>
              <Feature label={contentBlock(content, "label-custom-tauri-plugins")}><Markdown text={contentBlock(content, "three-in-repo-plugins-each-rust-plus-kotlin-data-folder-th")} inline /></Feature>
              <Feature label={contentBlock(content, "label-daily-brief-via-workmanager")}><Markdown text={contentBlock(content, "something-else-can-drop-a-markdown-brief-and-a-latest")} inline /></Feature>
              <Feature label={contentBlock(content, "label-feedback-to-github-issues")}><Markdown text={contentBlock(content, "the-more-screen-files-bugs-and-feature-requests-as-github")} inline /></Feature>
            </Features>
            <Markdown text={contentBlock(content, "writes-go-through-a-temporary-file-and-a-rename-on-desktop")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-the-last-release-recorded")} inline /></h2>
            <Markdown text={contentBlock(content, "from-docs-handover-2026-10-02-release")} paragraphClassName="aside-note" />
          </div>
          <div>
            <ul>
              <li><Markdown text={contentBlock(content, "133-commits-between-2026-07-05-and-2026-10-02")} inline /></li>
              <li><Markdown text={contentBlock(content, "599-unit-tests-and-102-browser-e2e-tests-passed-for-0")} inline /></li>
              <li><Markdown text={contentBlock(content, "the-signed-android-bundle-for-0")} inline /></li>
              <li><Markdown text={contentBlock(content, "a-ci-gate-measures-idle-background-behaviour-on-an-api-35")} inline /></li>
            </ul>
            <Markdown text={contentBlock(content, "version-1-was-a-much-larger-personal-research-instrument-a")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "the-rewrite-that-cut-scope-and-what-is-unsettled")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "docs-rewrite-v1")} />
            <ul>
              <li><Markdown text={contentBlock(content, "edits-are-checked-against-a-revision-just-before-they-are")} inline /></li>
              <li><Markdown text={contentBlock(content, "the-last-release-reached-play-s-internal-testing-track")} inline /></li>
              <li><Markdown text={contentBlock(content, "the-source-is-private-so-the-numbers-above-are-mine-and-no")} inline /></li>
            </ul>
            <OpenQuestion><Markdown text={contentBlock(content, "stats-are-deferred-not-ruled-out-and-the-bottom-nav-has-ro")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialssvelte-5-tauri-2-rust-kotlin")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintagejuly-2026-to-now")} inline /></div>
          <div><Markdown text={contentBlock(content, "statusactive-v0")} inline /></div>
          <div><Markdown text={contentBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="ballast" />
    </>
  );
}
