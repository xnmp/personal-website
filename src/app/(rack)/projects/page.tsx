import { EditableText } from "@/components/studio/EditableText";
import { BoundText } from "@/components/studio/BoundText";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import { ExplorerWindow } from "@/components/landing/ExplorerWindow";
import { Masthead } from "@/components/landing/Masthead";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";
import { MarginIndex } from "@/components/landing/MarginIndex";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, ModuleCard, Prop, RackKeys } from "@/components/rack";
import { readProjectCatalog } from "@/data/projects";
import { contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function generateMetadata() {
  return contentField<import("next").Metadata>(readContent("home"), "metadata");
}

// Atlas clips a viewport-sized sky to each text block; other styles hide it.
function CopySky() {
  return <span className="launchpad-sky" aria-hidden="true"><span /></span>;
}

export default function ProjectsPage() {
  const { FEATURED, FLAGSHIP, project, groups } = readProjectCatalog();
  const content = readContent("home");
  const about = readContent("about");
  const grouping = readContent("project-groups");

  const flagship = project(FLAGSHIP);
  const flagshipContent = readContent(`projects/${flagship.slug}`);
  const featured = FEATURED.map(project);
  const onFirstScreen = new Set([FLAGSHIP, ...FEATURED]);
  const mounted = groups.map(group => ({ group, items: group.projects.filter(p => !onFirstScreen.has(p.slug)) }));
  return (
    <>
      <RackKeys />
      <Masthead brand={contentField<string>(content, "brand")} brandBinding={bindField(content, ["brand"])} tagline={contentField<string>(content, "tagline")} taglineBinding={bindField(content, ["tagline"])} />
      <main id="content" className="rack-main" tabIndex={-1}>
        <MarginIndex />
        {/* the first screen, composed as the style's mock (globals.css: home landing) */}
        <div className="landing">
          <section className="launchpad" aria-labelledby="flagship-title">
            <div className="launchpad-copy">
              {/* data-text: a style that letters the name as art keys it to the word it paints */}
              <h2 id="flagship-title" className="launchpad-title" data-text={flagship.title}>
                <CopySky />
                <span className="launchpad-title-ink"><EditableText binding={bindField(flagshipContent, ["title"])}>{flagship.title}</EditableText></span>
              </h2>
              <p className="launchpad-pitch"><CopySky /><EditableText binding={bindField(flagshipContent, [flagship.summary === undefined ? "heading" : "summary"])}>{flagship.summary ?? flagship.heading}</EditableText></p>
              <div className="keys launchpad-keys">
                {flagship.website && <Key editableLabel href={flagship.website} tone="signal" size="lg">{flagshipContent.blocks.website !== undefined ? <Markdown {...bindBlock(flagshipContent, "website")} inline allowLinks={false} /> : `${flagship.title} website ↗`}</Key>}
                <Key editableLabel href={flagship.href} size="lg">{flagshipContent.blocks["project-notes"] !== undefined ? <Markdown {...bindBlock(flagshipContent, "project-notes")} inline allowLinks={false} /> : <EditableText binding={bindField(flagshipContent, ["title"])}>{flagship.title}</EditableText>}</Key>
              </div>
            </div>
            <a href={flagship.href} className="launchpad-window" data-rack-stop aria-label={`${flagship.title} details`}>
              <ExplorerWindow />
            </a>
          </section>
          <section className="showcase" aria-labelledby="showcase-title">
            <h2 id="showcase-title" className="showcase-title"><Markdown {...bindBlock(content, "projects")} inline /></h2>
            <ul className="showcase-row">
              {featured.map((p) => (
                <li key={p.slug}>
                  <ShowcaseCard p={p} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="hero-copy faceplate intro">
          <Prop kind="pin" />
          <div className="silk"><Markdown {...bindBlock(content, "field-notes-2026")} inline /></div>
          <h2 className="title"><Markdown {...bindBlock(content, "tools-i-use-every-day-spanand-agents-for-the-games-i-grew")} inline /></h2>
          <Markdown {...bindBlock(content, "a-file-manager-a-markdown-editor-a-mood-diary-and-the-bar")} paragraphClassName="lede" />
          <Markdown {...bindBlock(content, "linkmore-about-me-href-about-class-text-action")} paragraphClassName="hero-more" />
        </div>

        {mounted.map(({ group, items }) => {
          return (
            <section key={group.id} className="shelf-group" aria-labelledby={`rack-${group.id}`}>
              {/* a 1U blanking panel, silkscreened with the shelf's name */}
              <div className="divider faceplate">
                <h2 className="shelf-label" id={`rack-${group.id}`}>
                  <BoundText text={group.heading} binding={bindField(about, ["sections", group.sourceIndex, "heading"])} />
                </h2>
                <span className="shelf-count">{items.length} {items.length === 1 ? "project" : "projects"}</span>
              </div>
              {items.length > 0 ? <div className="shelf">
                {items.map((p) => (
                  <ModuleCard key={p.slug} p={p} />
                ))}
              </div> : <Markdown {...bindBlock(grouping, group.projects.length > 0 ? "featured-note" : "empty-note")} />}
            </section>
          );
        })}

      </main>
      <footer className="statusline">
        {/* each key with what it does, unbroken, its separator trailing it (the
            spaces explicit: one before an entity on its line is dropped) */}
        <span className="sl-keys fine-only"><Markdown {...bindBlock(content, "spankbdj-kbdk-projects-spankbd-open-spankbd-search-spankbd")} inline /></span>
        <span className="sl-contact"><Markdown {...bindBlock(content, "github-xnmp-https-github")} inline /></span>
        <span className="sl-contact"><Markdown {...bindBlock(content, "chonw-proton")} inline /></span>
        <span><Markdown {...bindBlock(content, "screens-themed-by-my-dotfiles-https-github")} inline /></span>
        <span><Markdown {...bindBlock(content, "art-generated-composited-for-this-site")} inline /></span>
      </footer>
    </>
  );
}
