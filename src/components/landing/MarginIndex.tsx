import Link from "next/link";
import { APP_THEME } from "@/components/launch/appTheme";
import { Markdown } from "@/components/notebook/Markdown";
import { readProjectCatalog } from "@/data/projects";
import { contentBlock } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function MarginIndex() {
  const { FLAGSHIP, projects, shelves } = readProjectCatalog();
  const home = readContent("home");

  /** A second presentation of the shared project catalogue, without card art. */

  return (
    <div className="margin-index">
      <div className="margin-intro">
        <Markdown text={contentBlock(home, "margin-intro")} paragraphClassName="margin-statement" />
        <Markdown text={contentBlock(home, "margin-description")} />
      </div>
      {shelves.map((shelf) => (
        <section className="margin-group" key={shelf.id} aria-labelledby={`margin-${shelf.id}`}>
          <h2 id={`margin-${shelf.id}`}>{shelf.label}</h2>
          <ol className="margin-list">
            {projects.filter((p) => p.shelf === shelf.id).map((p) => (
              <li className="margin-project" key={p.slug} data-featured={(p.slug === FLAGSHIP && p.preview) ? true : undefined}>
                <span className="margin-number" aria-hidden="true">{p.number}</span>
                <div className="margin-entry">
                  <h3><Link href={p.href} data-rack-stop>{p.title}</Link></h3>
                  <p>{p.summary ?? p.heading}</p>
                  <p className="margin-stack">{p.tags.join(" · ")}</p>
                </div>
                {p.slug === FLAGSHIP && p.preview && (
                  <div className="margin-feature">
                    <Link href={p.href} tabIndex={-1} className="margin-capture">
                      {Object.entries(APP_THEME).map(([rice, theme]) => (
                        <picture key={rice} data-rice-shot={rice}>
                          <img src={p.preview!.src.replace("{theme}", theme)} width={p.preview!.width} height={p.preview!.height} loading="lazy"
                            alt={p.preview!.alt} />
                        </picture>
                      ))}
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
