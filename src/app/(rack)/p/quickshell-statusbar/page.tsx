import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/quickshell-statusbar");

const REPO = contentField<string>(content, "repo");

export const metadata = contentField<import("next").Metadata>(content, "metadata");

export default function Page() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="quickshell-statusbar" />}
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
            <ProjectKicker slug="quickshell-statusbar" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "i-usually-have-several-terminals-running-claude-code-or-co")} />
            <Markdown text={contentBlock(content, "it-also-shows-cpu-ram-io-gpu-and-vram-with-hover-sparkline")} />
          </div>
          <div>
            <Screen art="/screens/quickshell-statusbar.png" tone="cyan" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "qml")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "hyprland")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "python")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "ricing")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "what-it-is")} inline /></div>
            <h2><Markdown text={contentBlock(content, "a-qml-bar-fed-by-two-python-streams")} inline /></h2>
            <Markdown text={contentBlock(content, "from-readme")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-bar-is-a-quickshell-qt-6-configuration-for-hyprland")} />
            <Markdown text={contentBlock(content, "other-cells-wi-fi-with-a-picker-backed-by-nmcli-battery-on")} />
            <Markdown text={contentBlock(content, "the-agent-state-comes-from-files-a-wezterm-hook-writes-und")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "technical-choices")} inline /></div>
            <h2><Markdown text={contentBlock(content, "a-pure-core-an-imperative-shell-and-a-contract-between-lan")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "lib-hypr-status-stream")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-one-line-of-the-stream-reformatted")}
              caption={contentBlock(content, "caption-from-tests-fixtures-stream-contract-json-trimmed-t")}
            >
              <Markdown text={contentBlock(content, "code-hypr-metrics-cpu-42-ram-63-io-7-gpu-18-vram-36-batter")} />
            </Plate>
            <Features>
              <Feature label={contentBlock(content, "label-contract-test-from-both-ends")}><Markdown text={contentBlock(content, "tests-test-stream-contract")} inline /></Feature>
              <Feature label={contentBlock(content, "label-sanitised-on-both-sides")}><Markdown text={contentBlock(content, "python-coerces-untrusted-values-with-helpers-like-bounded")} inline /></Feature>
              <Feature label={contentBlock(content, "label-pacing-that-learns")}><Markdown text={contentBlock(content, "quickshell-usagebudget")} inline /></Feature>
              <Feature label={contentBlock(content, "label-focus-edits-etc-hosts-carefully")}><Markdown text={contentBlock(content, "bin-focus-block-rewrites-only-a-marker-fenced-section-refu")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "quota-pacing")} inline /></div>
            <h2><Markdown text={contentBlock(content, "budget-per-day-instead-of-per-hour")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "dividing-what-is-left-by-the-hours-until-reset-is-far-too")} />
            <Markdown text={contentBlock(content, "where-a-quota-went-is-attributed-from-the-history-of-readi")} />
            <Markdown text={contentBlock(content, "claude-s-numbers-come-from-the-oauth-usage-endpoint-that-c")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "verified-numbers")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-is-in-the-repo")} inline /></h2>
            <Markdown text={contentBlock(content, "counted-from-the-checkout-test-counts-are-def-test-and-fun")} paragraphClassName="aside-note" />
          </div>
          <div>
            <ul>
              <li><Markdown text={contentBlock(content, "53-commits-between-2026-08-06-and-2026-09-28")} inline /></li>
              <li><Markdown text={contentBlock(content, "138-python-test-methods-across-the-stream-kit-contract-and")} inline /></li>
              <li><Markdown text={contentBlock(content, "three-shell-test-scripts-for-focus-block-rename-hypr-works")} inline /></li>
              <li><Markdown text={contentBlock(content, "about-9-700-lines-across-the-python-qml-and-javascript-sou")} inline /></li>
            </ul>
            <Markdown text={contentBlock(content, "the-qml-tests-run-offscreen-with-a-stub-for-the-quickshell")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "rough-edges")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-it-assumes-and-what-can-break")} inline /></h2>
          </div>
          <div>
            <ul>
              <li><Markdown text={contentBlock(content, "it-targets-hyprland-on-wayland-with-quickshell")} inline /></li>
              <li><Markdown text={contentBlock(content, "the-claude-quota-endpoint-is-the-one-claude-code-uses-not")} inline /></li>
              <li><Markdown text={contentBlock(content, "agent-state-needs-a-hook-on-the-terminal-side")} inline /></li>
              <li><Markdown text={contentBlock(content, "focus-needs-a-one-time-root-setup-install-the-script-and-a")} inline /></li>
              <li><Markdown text={contentBlock(content, "i-have-not-measured-the-streams-own-cpu-cost-so-i-cannot-s")} inline /></li>
            </ul>
            <OpenQuestion><Markdown text={contentBlock(content, "the-active-hours-figure-is-a-median-over-days-that-saw-any")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialsqml-qt-6-python-3")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintageaug-2026-to-now")} inline /></div>
          <div><Markdown text={contentBlock(content, "statusactive")} inline /></div>
          <div><Markdown text={contentBlock(content, "source-github-xnmp-setup-quickshell-statusbar-https-github")} inline /></div>
        </section>

      </main>
      <Folio slug="quickshell-statusbar" />
    </>
  );
}
