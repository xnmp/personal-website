import { bindBlock } from "@/lib/studio/bindings";
import { readContent } from "@/lib/content.server";
import { contentField } from "@/lib/content";
import { Folio, ProjectKicker, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";

const SLUG = "clt-interactive";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent(`projects/${SLUG}`), "metadata");
}

export default function CltInteractivePage() {
  const content = readContent(`projects/${SLUG}`);
  const essay = contentField<string>(content, "essay");
  return <>
    <RunningHead meta={<ProjectMeta slug={SLUG} />} nav={<>
      <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
      <Key editableLabel href={essay}><Markdown {...bindBlock(content, "open-essay")} inline allowLinks={false} /></Key>
    </>} />
    <main id="content" className="rack-main" tabIndex={-1}>
      <section className="detail-hero">
        <div>
          <ProjectKicker slug={SLUG} />
          <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
          <Markdown {...bindBlock(content, "intro")} />
          <div className="keys"><Key editableLabel href={essay} tone="signal"><Markdown {...bindBlock(content, "open-essay")} inline allowLinks={false} /></Key></div>
        </div>
        <Screen art="/screens/clt-interactive.svg" tone="amber" />
      </section>
      <section className="section">
        <h2><Markdown {...bindBlock(content, "experiments-heading")} inline /></h2>
        <div><Markdown {...bindBlock(content, "experiments")} /></div>
      </section>
      <section className="section">
        <h2><Markdown {...bindBlock(content, "construction-heading")} inline /></h2>
        <div><Markdown {...bindBlock(content, "construction")} /></div>
      </section>
    </main>
    <Folio slug={SLUG} />
  </>;
}
