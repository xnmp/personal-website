import { bindBlock } from "@/lib/studio/bindings";
import { readContent } from "@/lib/content.server";
import { contentField } from "@/lib/content";
import { Folio, ProjectKicker, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { AbelChapters } from "@/components/notebook/AbelChapters";
import { Key, Screen } from "@/components/rack";

const SLUG = "abel-ruffini";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent(`projects/${SLUG}`), "metadata");
}

export default function AbelRuffiniPage() {
  const content = readContent(`projects/${SLUG}`);
  return <>
    <RunningHead meta={<ProjectMeta slug={SLUG} />} nav={<Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>} />
    <main id="content" className="rack-main math-prose" tabIndex={-1}>
      <section className="detail-hero">
        <div>
          <ProjectKicker slug={SLUG} />
          <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
          <Markdown {...bindBlock(content, "intro")} />
        </div>
        <Screen art="/screens/abel-ruffini.svg" tone="amber" />
      </section>
      {(["starting", "recursion", "obstruction"] as const).map(id => <section className="section" key={id}>
        <h2><Markdown {...bindBlock(content, `${id}-heading`)} inline /></h2>
        <div><Markdown {...bindBlock(content, id)} math /></div>
      </section>)}
      <section className="section">
        <h2><Markdown {...bindBlock(content, "notes-heading")} inline /></h2>
        <div><Markdown {...bindBlock(content, "notes-intro")} /><AbelChapters /></div>
      </section>
      <section className="section"><div><Markdown {...bindBlock(content, "references")} /></div></section>
    </main>
    <Folio slug={SLUG} />
  </>;
}
