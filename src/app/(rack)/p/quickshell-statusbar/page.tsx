import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/quickshell-statusbar"), "metadata");
}

export default function Page() {
  const content = readContent("projects/quickshell-statusbar");

  const REPO = contentField<string>(content, "repo");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="quickshell-statusbar" />}
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
            <ProjectKicker slug="quickshell-statusbar" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "introduction")} />
          </div>
          <div>
            <Screen art="/screens/quickshell-statusbar.png" tone="cyan" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "qml")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "hyprland")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "python")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "ricing")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown {...bindBlock(content, "a-qml-bar-fed-by-two-python-streams")} inline /></h2>
            <Markdown {...bindBlock(content, "from-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-how-the-information-gets-there")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown {...bindBlock(content, "a-pure-core-an-imperative-shell-and-a-contract-between-lan")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-python-gathers-it-qml-displays-it")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-one-line-of-the-stream-reformatted")} figureBinding={bindBlock(content, "figure-fig-1-one-line-of-the-stream-reformatted").binding}
              caption={contentBlock(content, "caption-from-tests-fixtures-stream-contract-json-trimmed-t")} captionBinding={bindBlock(content, "caption-from-tests-fixtures-stream-contract-json-trimmed-t").binding}
            >
              <Markdown {...bindBlock(content, "code-hypr-metrics-cpu-42-ram-63-io-7-gpu-18-vram-36-batter")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "quota-pacing")} inline /></div>
            <h2><Markdown {...bindBlock(content, "budget-per-day-instead-of-per-hour")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-how-much-can-i-use-today")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-is-in-the-repo")} inline /></h2>
            <Markdown {...bindBlock(content, "counted-from-the-checkout-test-counts-are-def-test-and-fun")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-part-of-the-dotfiles")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-it-assumes-and-what-can-break")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-its-quite-specific-to-my-desktop")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialsqml-qt-6-python-3")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintageaug-2026-to-now")} inline /></div>
          <div><Markdown {...bindBlock(content, "statusactive")} inline /></div>
          <div><Markdown {...bindBlock(content, "source-github-xnmp-setup-quickshell-statusbar-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="quickshell-statusbar" />
    </>
  );
}
