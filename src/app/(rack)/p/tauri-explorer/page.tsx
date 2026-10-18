import { bindBlock, bindField } from "@/lib/studio/bindings";
import { ShotGallery, type Shot } from "@/components/launch/ShotGallery";
import { APP_THEME } from "@/components/launch/appTheme";
import { Folio, ProjectKicker, ProjectMeta, RunningHead } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const SLUG = "tauri-explorer";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent(`projects/${SLUG}`), "metadata");
}

export default function TauriExplorerPage() {
  const content = readContent(`projects/${SLUG}`);
  const website = contentField<string>(content, "website");
  const repo = contentField<string>(content, "repo");
  const shots = contentField<Shot[]>(content, "shots").map((shot, index) => ({
    ...shot,
    labelBinding: bindField(content, ["shots", index, "label"]),
    noteBinding: bindField(content, ["shots", index, "note"]),
  }));

  return <>
    <RunningHead meta={<ProjectMeta slug={SLUG} />} nav={<>
      <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
      <Key editableLabel href={website}><Markdown {...bindBlock(content, "website")} inline allowLinks={false} /></Key>
      <Key editableLabel href={repo}><Markdown {...bindBlock(content, "github")} inline allowLinks={false} /></Key>
    </>} />
    <main id="content" className="rack-main" tabIndex={-1}>
      <section className="detail-hero">
        <div>
          <ProjectKicker slug={SLUG} />
          <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
          <Markdown {...bindBlock(content, "subtitle")} />
          <Markdown {...bindBlock(content, "intro")} />
          <Markdown {...bindBlock(content, "website-note")} />
        </div>
        <Screen>
          {Object.entries(APP_THEME).map(([rice, theme]) => (
            <picture key={rice} data-rice-shot={rice}>
              <img src={`/tauri/hero-quick-open-${theme}.webp`} width={698} height={438}
                alt={contentBlock(content, "screenshot-alt")}
                loading="lazy" className="shot-img" />
            </picture>
          ))}
        </Screen>
      </section>
      <section className="section">
        <div>
          <div className="section-kicker"><Markdown {...bindBlock(content, "origin-kicker")} inline /></div>
          <h2><Markdown {...bindBlock(content, "origin-heading")} inline /></h2>
        </div>
        <div>
          <Markdown {...bindBlock(content, "origin-story")} />
          <Markdown {...bindBlock(content, "origin-aside")} />
        </div>
      </section>
      <section className="section">
        <div>
          <div className="section-kicker"><Markdown {...bindBlock(content, "building-kicker")} inline /></div>
          <h2><Markdown {...bindBlock(content, "building-heading")} inline /></h2>
        </div>
        <div>
          <Markdown {...bindBlock(content, "building-body")} />
          <Markdown {...bindBlock(content, "quick-open-note")} />
        </div>
      </section>
      <section className="shots" aria-label="Screenshots">
        <ShotGallery shots={shots} phoneMedia="(max-width: 600px)" />
      </section>
      <section className="colophon">
        <div><Markdown {...bindBlock(content, "materials")} inline /></div>
        <div><Markdown {...bindBlock(content, "platforms")} inline /></div>
        <div><Markdown {...bindBlock(content, "licence")} inline /></div>
        <div><Markdown {...bindBlock(content, "source")} inline /></div>
      </section>
    </main>
    <Folio slug={SLUG} />
  </>;
}
