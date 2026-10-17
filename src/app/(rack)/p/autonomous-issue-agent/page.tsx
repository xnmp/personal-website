import Image from "next/image";
import { Feature, Features, Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { EditableText } from "@/components/studio/EditableText";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";
import { bindBlock, bindField } from "@/lib/studio/bindings";

const SLUG = "autonomous-issue-agent";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent(`projects/${SLUG}`), "metadata");
}

export default function Page() {
  const content = readContent(`projects/${SLUG}`);
  const tags = contentField<string[]>(content, "tags");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug={SLUG} />}
        nav={
          <>
            <Key href="/"><Markdown {...bindBlock(content, "all-projects")} inline /></Key>
            <Key href={contentField<string>(content, "repo")}><Markdown {...bindBlock(content, "github")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>
        <section className="detail-hero">
          <div>
            <ProjectKicker slug={SLUG} />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "intro")} />
            <Markdown {...bindBlock(content, "ownership")} />
          </div>
          <div>
            <Screen art="/screens/autonomous-issue-agent.png" tone="amber" />
            <Tags>
              {tags.map((tag, i) => <Tag key={tag}><EditableText binding={bindField(content, ["tags", i])}>{tag}</EditableText></Tag>)}
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "workflow-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "workflow-title")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "workflow-body")} />
            <Plate
              figure={contentBlock(content, "workflow-figure")} figureBinding={bindBlock(content, "workflow-figure").binding}
              caption={contentBlock(content, "workflow-caption")} captionBinding={bindBlock(content, "workflow-caption").binding}
            >
              <Markdown {...bindBlock(content, "workflow-code")} />
            </Plate>
          </div>
        </section>

        <section className="section stack">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "dashboard-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "dashboard-title")} inline /></h2>
            <Markdown {...bindBlock(content, "dashboard-body")} />
          </div>
          <div>
            <Plate
              figure={contentBlock(content, "board-figure")} figureBinding={bindBlock(content, "board-figure").binding}
              caption={contentBlock(content, "board-caption")} captionBinding={bindBlock(content, "board-caption").binding}
            >
              <Image src="/autonomous-issue-agent/board.webp" alt={contentBlock(content, "board-alt")} width={1440} height={1700} className="shot-img" sizes="(max-width: 760px) 100vw, 1000px" />
            </Plate>
            <Plate
              figure={contentBlock(content, "completed-figure")} figureBinding={bindBlock(content, "completed-figure").binding}
              caption={contentBlock(content, "completed-caption")} captionBinding={bindBlock(content, "completed-caption").binding}
            >
              <Image src="/autonomous-issue-agent/completed.webp" alt={contentBlock(content, "completed-alt")} width={1440} height={900} className="shot-img" sizes="(max-width: 760px) 100vw, 1000px" />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "architecture-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "architecture-title")} inline /></h2>
          </div>
          <div>
            <Features>
              {["decisions", "money", "sandbox"].map((name) => (
                <Feature key={name} label={contentBlock(content, `${name}-label`)} labelBinding={bindBlock(content, `${name}-label`).binding}>
                  <Markdown {...bindBlock(content, `${name}-body`)} inline />
                </Feature>
              ))}
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "results-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "results-title")} inline /></h2>
            <Markdown {...bindBlock(content, "results-source")} paragraphClassName="aside-note" />
          </div>
          <div><Markdown {...bindBlock(content, "results-body")} /></div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "limits-kicker")} inline /></div>
            <h2><Markdown {...bindBlock(content, "limits-title")} inline /></h2>
          </div>
          <div><Markdown {...bindBlock(content, "limits-body")} /></div>
        </section>

        <section className="colophon">
          {["materials", "status", "source"].map((name) => <div key={name}><Markdown {...bindBlock(content, name)} inline /></div>)}
        </section>
      </main>
      <Folio slug={SLUG} />
    </>
  );
}
