import { Fragment } from "react";
import { EditableText } from "@/components/studio/EditableText";
import { BoundText } from "@/components/studio/BoundText";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import Link from "next/link";
import { EditableLink } from "@/components/studio/EditableLink";
import { APP_THEME } from "@/components/launch/appTheme";
import { Screen } from "@/components/rack/Screen";
import { Markdown } from "@/components/notebook/Markdown";
import { readProjectCatalog } from "@/data/projects";
import { contentBlock } from "@/lib/content";
import { readContent } from "@/lib/content.server";

export function ProjectDirectory() {
  const { FLAGSHIP, groups } = readProjectCatalog();
  const home = readContent("home");
  const about = readContent("about");
  const grouping = readContent("project-groups");

  /** One content tree: styles change its surfaces, never its copy or membership. */

  return (
    <div className="margin-index project-directory">
      <h1 className="sr-only"><BoundText text={contentBlock(home, "projects")} binding={bindBlock(home, "projects").binding} /></h1>
      <div className="margin-intro faceplate">
        <Markdown
          {...bindBlock(home, "margin-intro")}
          paragraphClassName="margin-statement"
        />
        <Markdown {...bindBlock(home, "margin-description")} />
      </div>
      {groups.map((group) => (
        <section
          className="margin-group"
          key={group.id}
          id={group.id}
          aria-labelledby={`margin-${group.id}`}
        >
          <h2 className="divider faceplate" id={`margin-${group.id}`}>
            <BoundText text={group.heading} binding={bindField(about, ["sections", group.sourceIndex, "heading"])} />
          </h2>
          <ol className="margin-list shelf">
            {group.projects
              .map((p) => {
                const source = readContent(`projects/${p.slug}`);
                return (
                  <li
                    className="margin-project faceplate"
                    key={p.slug}
                    data-featured={
                      p.slug === FLAGSHIP && p.preview ? true : undefined
                    }
                  >
                    {!(p.slug === FLAGSHIP && p.preview) && <div className="directory-art"><Screen art={p.art} tone={p.tone} /></div>}
                    <span className="margin-number" aria-hidden="true">
                      {p.number}
                    </span>
                    <div className="margin-entry">
                      <h3>
                        <EditableLink href={p.href} data-rack-stop>
                          <EditableText binding={bindField(source, ["title"])}>
                            {p.title}
                          </EditableText>
                        </EditableLink>
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
          {group.projects.length === 0 && <Markdown {...bindBlock(grouping, "empty-note")} />}
        </section>
      ))}
    </div>
  );
}
