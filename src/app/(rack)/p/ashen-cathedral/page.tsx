import { Feature, Features, Folio, OpenQuestion, Plate, ProjectKicker, ProjectMeta, RunningHead, Tag, Tags } from "@/components/notebook";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, Screen } from "@/components/rack";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("projects/ashen-cathedral");

export const metadata = contentField<import("next").Metadata>(content, "metadata");


export default function AshenCathedralPage() {
  return (
    <>
      <RunningHead
        meta={<ProjectMeta slug="ashen-cathedral" />}
        nav={
          <>
            <Key href="/"><Markdown text={contentBlock(content, "all-projects")} inline /></Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="ashen-cathedral" />
            <h1><Markdown text={contentBlock(content, "headline")} inline /></h1>
            <Markdown text={contentBlock(content, "an-original-first-person-game-for-unreal-engine-5")} />
            <Markdown text={contentBlock(content, "it-is-paused-as-a-work-in-progress")} />
          </div>
          <div>
            <Screen art="/screens/diablo-clone.png" tone="rust" />
            <Tags>
              <Tag><Markdown text={contentBlock(content, "unreal-5")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "c")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "blender-python")} inline /></Tag>
              <Tag><Markdown text={contentBlock(content, "paused")} inline /></Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-core")} inline /></div>
            <h2><Markdown text={contentBlock(content, "game-rules-that-compile-without-unreal")} inline /></h2>
            <Markdown text={contentBlock(content, "seven-headers-in-source-ashencathedral-domain-871-lines-co")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "combat-resources-items-trading-abilities-enemy-stats-the-t")} />
            <Markdown text={contentBlock(content, "that-split-is-what-makes-the-tests-cheap")} />
            <Plate
              figure={contentBlock(content, "figure-fig-1-one-of-eight-sanitizer-runs")}
              caption={contentBlock(content, "caption-from-scripts-test-rules-sh-the-other-seven-follow")}
            >
              <Markdown text={contentBlock(content, "code-clang-std-c-17-wall-wextra-werror-fsanitize-address-u")} />
            </Plate>
            <Markdown text={contentBlock(content, "the-tests-include-hostile-input")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-game")} inline /></div>
            <h2><Markdown text={contentBlock(content, "what-is-playable")} inline /></h2>
          </div>
          <div>
            <Features>
              <Feature label={contentBlock(content, "label-built-at-runtime")}><Markdown text={contentBlock(content, "the-dungeon-geometry-and-encounters-are-constructed-by-the")} inline /></Feature>
              <Feature label={contentBlock(content, "label-fog-of-war")}><Markdown text={contentBlock(content, "in-the-dungeon-the-minimap-reveals-cells-by-integer-line-o")} inline /></Feature>
              <Feature label={contentBlock(content, "label-grid-inventory")}><Markdown text={contentBlock(content, "a-10-by-4-pack")} inline /></Feature>
              <Feature label={contentBlock(content, "label-the-butcher")}><Markdown text={contentBlock(content, "below-half-health-he-attacks-faster")} inline /></Feature>
              <Feature label={contentBlock(content, "label-greyhollow")}><Markdown text={contentBlock(content, "a-small-village-with-a-healer-a-blacksmith-who-buys-and-se")} inline /></Feature>
              <Feature label={contentBlock(content, "label-short-on-purpose")}><Markdown text={contentBlock(content, "the-readme-calls-it-a-short-horror-vertical-slice")} inline /></Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-pipeline")} inline /></div>
            <h2><Markdown text={contentBlock(content, "assets-generated-from-code")} inline /></h2>
            <Markdown text={contentBlock(content, "scripts-has-12-generate")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "props-the-reliquary-the-gate-the-town-and-several-characte")} />
            <Markdown text={contentBlock(content, "the-butcher-shows-how-this-goes")} />
            <Plate
              figure={contentBlock(content, "figure-fig-2-the-butcher-idle-wind-up-walk-death")}
              caption={contentBlock(content, "caption-a-review-sheet-from-artsource-candidates-butcherde")}
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
              figure={contentBlock(content, "figure-fig-3-the-procedural-butcher-it-replaced")}
              caption={contentBlock(content, "caption-sm-butcher-a-static-mesh-from-primitives-docs-art")}
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
            <div className="section-kicker"><Markdown text={contentBlock(content, "the-incident")} inline /></div>
            <h2><Markdown text={contentBlock(content, "my-gpu-fell-off-the-bus-so-the-agents-got-limits")} inline /></h2>
            <Markdown text={contentBlock(content, "sources-docs-gpu-incident")} paragraphClassName="aside-note" />
          </div>
          <div>
            <Markdown text={contentBlock(content, "on-7-september-2026-while-a-packaged-native-build-was-runn")} />
            <Markdown text={contentBlock(content, "the-cause-is-still-open")} />
            <Markdown text={contentBlock(content, "what-i-could-do-was-reduce-the-load-and-record-better-evid")} />
            <Markdown text={contentBlock(content, "it-was-tested-20-lightweight-guard-tests-passed-on-23-sept")} />
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker"><Markdown text={contentBlock(content, "where-it-stands")} inline /></div>
            <h2><Markdown text={contentBlock(content, "paused-with-a-known-gap")} inline /></h2>
          </div>
          <div>
            <Markdown text={contentBlock(content, "the-repository-has-4-commits-between-25-and-26-september-2")} />
            <OpenQuestion><Markdown text={contentBlock(content, "is-the-fault-the-gpu-the-pcie-link-the-driver-or-load-i-cr")} inline /></OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div><Markdown text={contentBlock(content, "materialsunreal-engine-5")} inline /></div>
          <div><Markdown text={contentBlock(content, "vintageseptember-2026")} inline /></div>
          <div><Markdown text={contentBlock(content, "statuspaused-wip")} inline /></div>
          <div><Markdown text={contentBlock(content, "sourceprivate")} inline /></div>
        </section>

      </main>
      <Folio slug="ashen-cathedral" />
    </>
  );
}
