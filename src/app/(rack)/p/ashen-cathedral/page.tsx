import { bindBlock } from "@/lib/studio/bindings";
import { Folio, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("projects/ashen-cathedral"), "metadata");
}

export default function AshenCathedralPage() {
  const content = readContent("projects/ashen-cathedral");

  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="ashen-cathedral" />}
        nav={
          <>
            <Key editableLabel href="/projects"><Markdown {...bindBlock(content, "all-projects")} inline allowLinks={false} /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="ashen-cathedral" />
            <h1><Markdown {...bindBlock(content, "headline")} inline /></h1>
            <Markdown {...bindBlock(content, "introduction")} />
          </div>
          <div>
            <Screen art="/screens/diablo-clone.png" tone="rust" />
            <Tags>
              <Tag><Markdown {...bindBlock(content, "unreal-5")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "c")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "blender-python")} inline /></Tag>
              <Tag><Markdown {...bindBlock(content, "paused")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-core")} inline /></div>
            <h2><Markdown {...bindBlock(content, "game-rules-that-compile-without-unreal")} inline /></h2>
            <Markdown {...bindBlock(content, "seven-headers-in-source-ashencathedral-domain-871-lines-co")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-working-without-the-editor-open")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-one-of-eight-sanitizer-runs")} figureBinding={bindBlock(content, "figure-fig-1-one-of-eight-sanitizer-runs").binding}
              caption={contentBlock(content, "caption-from-scripts-test-rules-sh-the-other-seven-follow")} captionBinding={bindBlock(content, "caption-from-scripts-test-rules-sh-the-other-seven-follow").binding}
            >
              <Markdown {...bindBlock(content, "code-clang-std-c-17-wall-wextra-werror-fsanitize-address-u")} />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-game")} inline /></div>
            <h2><Markdown {...bindBlock(content, "what-is-playable")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-what-you-can-walk-around-in")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-pipeline")} inline /></div>
            <h2><Markdown {...bindBlock(content, "assets-generated-from-code")} inline /></h2>
            <Markdown {...bindBlock(content, "scripts-has-12-generate")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-making-things-with-blender-scripts")} />
            <Plate
              figure={contentBlock(content, "figure-fig-2-the-butcher-idle-wind-up-walk-death")} figureBinding={bindBlock(content, "figure-fig-2-the-butcher-idle-wind-up-walk-death").binding}
              caption={contentBlock(content, "caption-a-review-sheet-from-artsource-candidates-butcherde")} captionBinding={bindBlock(content, "caption-a-review-sheet-from-artsource-candidates-butcherde").binding}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static review render */}
              <img
                src="/ashen-cathedral/butcher-sheet.webp"
                alt={contentBlock(content, "alt-four-renders-of-the-butcher-standing-with-a-cleaver-ra")}
                width={1280}
                height={427}
                loading="lazy"
              />
            </Plate>
            <Plate
              figure={contentBlock(content, "figure-fig-3-the-procedural-butcher-it-replaced")} figureBinding={bindBlock(content, "figure-fig-3-the-procedural-butcher-it-replaced").binding}
              caption={contentBlock(content, "caption-sm-butcher-a-static-mesh-from-primitives-docs-art")} captionBinding={bindBlock(content, "caption-sm-butcher-a-static-mesh-from-primitives-docs-art").binding}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static preview render */}
              <img
                src="/ashen-cathedral/butcher-procedural.webp"
                alt={contentBlock(content, "alt-a-blocky-pink-orange-butcher-figure-with-a-plank-mask")}
                width={540}
                height={720}
                loading="lazy"
                className="plate-portrait"
              />
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "the-incident")} inline /></div>
            <h2><Markdown {...bindBlock(content, "my-gpu-fell-off-the-bus-so-the-agents-got-limits")} inline /></h2>
            <Markdown {...bindBlock(content, "sources-docs-gpu-incident")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-then-the-gpu-fell-off-the-bus")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown {...bindBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown {...bindBlock(content, "paused-with-a-known-gap")} inline /></h2>
          </div>
          <div>
            <Markdown {...bindBlock(content, "body-an-experiment-to-come-back-to")} />
          </div>
        </section>

        <section className="colophon">
          <div><Markdown {...bindBlock(content, "materialsunreal-engine-5")} inline /></div>
          <div><Markdown {...bindBlock(content, "vintageseptember-2026")} inline /></div>
          <div><Markdown {...bindBlock(content, "statuspaused-wip")} inline /></div>
          <div><Markdown {...bindBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="ashen-cathedral" />
    </>
  );
}
