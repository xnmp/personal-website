import Image from "next/image";
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

        <section className="section stack">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "screenshots-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "screenshots-title")} inline /></h2>
            <Markdown {...bindBlock(content, "screenshots-intro")} />
          </div>
          <div className="features">
            {(["diary", "calendar", "entry"] as const).map((shot) => (
              <Plate key={shot}
                figure={contentBlock(content, `${shot}-figure`)} figureBinding={bindBlock(content, `${shot}-figure`).binding}
                caption={contentBlock(content, `${shot}-caption`)} captionBinding={bindBlock(content, `${shot}-caption`).binding}
              >
                <Image src={`/ballast/${shot}.webp`} alt={contentBlock(content, `${shot}-alt`)} width={390} height={844} className="shot-img" sizes="(max-width: 600px) 100vw, 390px" />
              </Plate>
            ))}
          </div>
        </section>

      </main>
      <Folio slug="ballast" />
    </>
  );
}
