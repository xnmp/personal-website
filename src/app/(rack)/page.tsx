import { ExplorerWindow } from "@/components/landing/ExplorerWindow";
import { Masthead } from "@/components/landing/Masthead";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";
import { Markdown } from "@/components/notebook/Markdown";
import { Key, ModuleCard, Prop, RackKeys } from "@/components/rack";
import { FEATURED, FLAGSHIP, project, projects, shelves } from "@/data/projects";
import { contentBlock, contentField } from "@/lib/content";
import { readContent } from "@/lib/content.server";

const content = readContent("home");

// Atlas clips a viewport-sized sky to each text block; other styles hide it.
function CopySky() {
  return <span className="launchpad-sky" aria-hidden="true"><span /></span>;
}

export default function Home() {
  const flagship = project(FLAGSHIP);
  const featured = FEATURED.map(project);
  const onFirstScreen = new Set([FLAGSHIP, ...FEATURED]);
  // the shelves hold the rest, each shelf only if it has any
  const mounted = shelves
    .map((shelf) => ({ shelf, items: projects.filter((p) => p.shelf === shelf.id && !onFirstScreen.has(p.slug)) }))
    .filter(({ items }) => items.length > 0);
  return (
    <>
      <RackKeys />
      <Masthead brand={contentField<string>(content, "brand")} tagline={contentField<string>(content, "tagline")} />
      <main id="content" className="rack-main" tabIndex={-1}>
        {/* the first screen, composed as the style's mock (globals.css: home landing) */}
        <div className="landing">
          <section className="launchpad" aria-labelledby="flagship-title">
            <div className="launchpad-copy">
              {/* data-text: a style that letters the name as art keys it to the word it paints */}
              <h2 id="flagship-title" className="launchpad-title" data-text={flagship.title}>
                <CopySky />
                <span className="launchpad-title-ink">{flagship.title}</span>
              </h2>
              <p className="launchpad-pitch"><CopySky /><Markdown text={contentBlock(content, "a-keyboard-first-file-manager")} inline /></p>
              <p className="launchpad-call"><CopySky /><Markdown text={contentBlock(content, "alpha-testers-wanted")} inline /></p>
              <div className="keys launchpad-keys">
                <Key href={`${flagship.href}#alpha`} tone="signal" size="lg" ariaLabel={`Join the ${flagship.title} alpha`}><Markdown text={contentBlock(content, "join-the-alpha-span-class-key-arrow")} inline /></Key>
                <Key href={`${flagship.href}#live`} size="lg"><Markdown text={contentBlock(content, "try-it-live")} inline /></Key>
              </div>
            </div>
            <a href={flagship.href} className="launchpad-window" data-rack-stop aria-label={`${flagship.title} details`}>
              <ExplorerWindow />
            </a>
          </section>
          <section className="showcase" aria-labelledby="showcase-title">
            <h2 id="showcase-title" className="showcase-title"><Markdown text={contentBlock(content, "projects")} inline /></h2>
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
          <div className="silk"><Markdown text={contentBlock(content, "field-notes-2026")} inline /></div>
          <h2 className="title"><Markdown text={contentBlock(content, "tools-i-use-every-day-spanand-agents-for-the-games-i-grew")} inline /></h2>
          <Markdown text={contentBlock(content, "a-file-manager-a-markdown-editor-a-mood-diary-and-the-bar")} paragraphClassName="lede" />
          <Markdown text={contentBlock(content, "linkmore-about-me-href-about-class-text-action")} paragraphClassName="hero-more" />
        </div>

        {mounted.map(({ shelf, items }) => {
          return (
            <div key={shelf.id} className="shelf-group">
              {/* a 1U blanking panel, silkscreened with the shelf's name */}
              <div className="divider faceplate">
                <h2 className="shelf-label">
                  {shelf.label}{" "}
                  <span className="shelf-note">{shelf.note}</span>
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
        <span className="sl-keys fine-only"><Markdown text={contentBlock(content, "spankbdj-kbdk-projects-spankbd-open-spankbd-search-spankbd")} inline /></span>
        <span><Markdown text={contentBlock(content, "github-xnmp-https-github")} inline /></span>
        <span><Markdown text={contentBlock(content, "chonw-proton")} inline /></span>
        <span><Markdown text={contentBlock(content, "screens-themed-by-my-dotfiles-https-github")} inline /></span>
        <span><Markdown text={contentBlock(content, "art-generated-composited-for-this-site")} inline /></span>
      </footer>
    </>
  );
}
