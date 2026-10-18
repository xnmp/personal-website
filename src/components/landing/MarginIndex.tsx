import { Fragment } from "react";
import { EditableText } from "@/components/studio/EditableText";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import Link from "next/link";
import { APP_THEME } from "@/components/launch/appTheme";
import { Markdown } from "@/components/notebook/Markdown";
import { readProjectCatalog } from "@/data/projects";
import { readContent } from "@/lib/content.server";

export function MarginIndex() {
  const { FLAGSHIP, projects, shelves } = readProjectCatalog();
  const home = readContent("home");

  /** A second presentation of the shared project catalogue, without card art. */

  return (
    <div className="margin-index">
      <div className="margin-intro">
        <Markdown
          {...bindBlock(home, "margin-intro")}
          paragraphClassName="margin-statement"
        />
        <Markdown {...bindBlock(home, "margin-description")} />
      </div>
      {shelves.map((shelf, shelfIndex) => (
        <section
          className="margin-group"
          key={shelf.id}
          aria-labelledby={`margin-${shelf.id}`}
        >
          <h2 id={`margin-${shelf.id}`}>
            <EditableText
              binding={bindField(home, ["shelves", shelfIndex, "label"])}
            >
              {shelf.label}
            </EditableText>
          </h2>
          <ol className="margin-list">
            {projects
              .filter((p) => p.shelf === shelf.id)
              .map((p) => {
                const source = readContent(`projects/${p.slug}`);
                return (
                  <li
                    className="margin-project"
                    key={p.slug}
                    data-featured={
                      p.slug === FLAGSHIP && p.preview ? true : undefined
                    }
                  >
                    <span className="margin-number" aria-hidden="true">
                      {p.number}
                    </span>
                    <div className="margin-entry">
                      <h3>
                        <Link href={p.href} data-rack-stop>
                          <EditableText binding={bindField(source, ["title"])}>
                            {p.title}
                          </EditableText>
                        </Link>
                      </h3>
                      <Markdown
                        binding={bindField(source, [
                          p.summary === undefined ? "heading" : "summary",
                        ])}
                        text={p.summary ?? p.heading}
                      />
                      <p className="margin-stack">
                        {p.tags.map((tag, index) => (
                          <Fragment key={index}>
                            {index ? " · " : null}
                            <EditableText
                              binding={bindField(source, ["tags", index])}
                            >
                              {tag}
                            </EditableText>
                          </Fragment>
                        ))}
                      </p>
                    </div>
                    {p.slug === FLAGSHIP && p.preview && (
                      <div className="margin-feature">
                        <Link
                          href={p.href}
                          tabIndex={-1}
                          className="margin-capture"
                        >
                          {Object.entries(APP_THEME).map(([rice, theme]) => (
                            <picture key={rice} data-rice-shot={rice}>
                              <img
                                src={p.preview!.src.replace("{theme}", theme)}
                                width={p.preview!.width}
                                height={p.preview!.height}
                                loading="lazy"
                                alt={p.preview!.alt}
                              />
                            </picture>
                          ))}
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
