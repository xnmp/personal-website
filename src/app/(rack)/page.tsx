import { EditableText } from "@/components/studio/EditableText";
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

// Atlas clips a viewport-sized sky to each text block; other styles hide it.
function CopySky() {
  return <span className="launchpad-sky" aria-hidden="true"><span /></span>;
}

export default function Home() {
  const { FEATURED, FLAGSHIP, project, projects, shelves } = readProjectCatalog();
  const content = readContent("home");

  const flagship = project(FLAGSHIP);
  const flagshipContent = readContent(`projects/${flagship.slug}`);
  const featured = FEATURED.map(project);
  const onFirstScreen = new Set([FLAGSHIP, ...FEATURED]);
  // the shelves hold the rest, each shelf only if it has any
  const mounted = shelves
    .map((shelf, sourceIndex) => ({ shelf, sourceIndex, items: projects.filter((p) => p.shelf === shelf.id && !onFirstScreen.has(p.slug)) }))
    .filter(({ items }) => items.length > 0);
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
              <p className="launchpad-pitch"><CopySky /><Markdown {...bindBlock(content, "a-keyboard-first-file-manager")} inline /></p>
              <p className="launchpad-call"><CopySky /><Markdown {...bindBlock(content, "alpha-testers-wanted")} inline /></p>
              <div className="keys launchpad-keys">
                <Key href={`${flagship.href}#alpha`} tone="signal" size="lg" ariaLabel={`Join the ${flagship.title} alpha`}><Markdown {...bindBlock(content, "join-the-alpha-span-class-key-arrow")} inline allowLinks={false} /></Key>
                <Key href={`${flagship.href}#live`} size="lg"><Markdown {...bindBlock(content, "try-it-live")} inline allowLinks={false} /></Key>
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

        {mounted.map(({ shelf, sourceIndex, items }) => {
          return (
            <div key={shelf.id} className="shelf-group">
              {/* a 1U blanking panel, silkscreened with the shelf's name */}
              <div className="divider faceplate">
                <h2 className="shelf-label">
                  <EditableText binding={bindField(content, ["shelves", sourceIndex, "label"])}>{shelf.label}</EditableText>{" "}
                  <span className="shelf-note"><EditableText binding={bindField(content, ["shelves", sourceIndex, "note"])}>{shelf.note}</EditableText></span>
                </h2>
                <span className="shelf-count">{items.length} {items.length === 1 ? "project" : "projects"}</span>
              </div>
              <div className="shelf">
                {items.map((p) => (
                  <ModuleCard key={p.slug} p={p} />
                ))}
              </div>
            </div>
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
