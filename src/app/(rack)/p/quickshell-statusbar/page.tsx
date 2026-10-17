import { bindBlock } from "@/lib/studio/bindings";
import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
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
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline /></Key>
            <Key href={REPO}><Markdown {...bindBlock(content, "github")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="quickshell-statusbar" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "i-usually-have-several-terminals-running-claude-code-or-co")} />
            <Markdown {...bindBlock(content, "it-also-shows-cpu-ram-io-gpu-and-vram-with-hover-sparkline")} />
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
            <Markdown {...bindBlock(content, "the-bar-is-a-quickshell-qt-6-configuration-for-hyprland")} />
            <Markdown {...bindBlock(content, "other-cells-wi-fi-with-a-picker-backed-by-nmcli-battery-on")} />
            <Markdown {...bindBlock(content, "the-agent-state-comes-from-files-a-wezterm-hook-writes-und")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown {...bindBlock(content, "a-pure-core-an-imperative-shell-and-a-contract-between-lan")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "lib-hypr-status-stream")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-one-line-of-the-stream-reformatted")} figureBinding={bindBlock(content, "figure-fig-1-one-line-of-the-stream-reformatted").binding}
              caption={contentBlock(content, "caption-from-tests-fixtures-stream-contract-json-trimmed-t")} captionBinding={bindBlock(content, "caption-from-tests-fixtures-stream-contract-json-trimmed-t").binding}
            >
              <Markdown {...bindBlock(content, "code-hypr-metrics-cpu-42-ram-63-io-7-gpu-18-vram-36-batter")} />
            </Plate>
            <Features>
              <Feature label={contentBlock(content, "label-contract-test-from-both-ends")} labelBinding={bindBlock(content, "label-contract-test-from-both-ends").binding}><Markdown {...bindBlock(content, "tests-test-stream-contract")} inline /></Feature>
              <Feature label={contentBlock(content, "label-sanitised-on-both-sides")} labelBinding={bindBlock(content, "label-sanitised-on-both-sides").binding}><Markdown {...bindBlock(content, "python-coerces-untrusted-values-with-helpers-like-bounded")} inline /></Feature>
              <Feature label={contentBlock(content, "label-pacing-that-learns")} labelBinding={bindBlock(content, "label-pacing-that-learns").binding}><Markdown {...bindBlock(content, "quickshell-usagebudget")} inline /></Feature>
              <Feature label={contentBlock(content, "label-focus-edits-etc-hosts-carefully")} labelBinding={bindBlock(content, "label-focus-edits-etc-hosts-carefully").binding}><Markdown {...bindBlock(content, "bin-focus-block-rewrites-only-a-marker-fenced-section-refu")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "quota-pacing")} inline /></div>
            <h2><Markdown {...bindBlock(content, "budget-per-day-instead-of-per-hour")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "dividing-what-is-left-by-the-hours-until-reset-is-far-too")} />
            <Markdown {...bindBlock(content, "where-a-quota-went-is-attributed-from-the-history-of-readi")} />
            <Markdown {...bindBlock(content, "claude-s-numbers-come-from-the-oauth-usage-endpoint-that-c")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-is-in-the-repo")} inline /></h2>
            <Markdown {...bindBlock(content, "counted-from-the-checkout-test-counts-are-def-test-and-fun")} paragraphClassName="aside-note" />
          </div>
          <div>
            <ul>
              <li><Markdown {...bindBlock(content, "53-commits-between-2026-08-06-and-2026-09-28")} inline /></li>
              <li><Markdown {...bindBlock(content, "138-python-test-methods-across-the-stream-kit-contract-and")} inline /></li>
              <li><Markdown {...bindBlock(content, "three-shell-test-scripts-for-focus-block-rename-hypr-works")} inline /></li>
              <li><Markdown {...bindBlock(content, "about-9-700-lines-across-the-python-qml-and-javascript-sou")} inline /></li>
            </ul>
            <Markdown {...bindBlock(content, "the-qml-tests-run-offscreen-with-a-stub-for-the-quickshell")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-it-assumes-and-what-can-break")} inline /></h2>
          </div>
          <div>
            <ul>
              <li><Markdown {...bindBlock(content, "it-targets-hyprland-on-wayland-with-quickshell")} inline /></li>
              <li><Markdown {...bindBlock(content, "the-claude-quota-endpoint-is-the-one-claude-code-uses-not")} inline /></li>
              <li><Markdown {...bindBlock(content, "agent-state-needs-a-hook-on-the-terminal-side")} inline /></li>
              <li><Markdown {...bindBlock(content, "focus-needs-a-one-time-root-setup-install-the-script-and-a")} inline /></li>
              <li><Markdown {...bindBlock(content, "i-have-not-measured-the-streams-own-cpu-cost-so-i-cannot-s")} inline /></li>
            </ul>
            <OpenQuestion><Markdown {...bindBlock(content, "the-active-hours-figure-is-a-median-over-days-that-saw-any")} inline /></OpenQuestion>
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
