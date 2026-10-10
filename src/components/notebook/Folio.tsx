import { Cap } from "@/components/rack/Key";
import { project, projects, statusLabel } from "@/data/projects";

/** The bottom plate of a detail page: the project's number of the total,
 *  and the way to the others. Both from the data, so adding or removing a
 *  project renumbers every page. */
export function Folio({ slug }: { slug: string }) {
  return (
    <footer className="folio">
      <span className="fine-only">
        Press <Cap>/</Cap> for the other projects
      </span>
      <span>
        {project(slug).number} / {String(projects.length).padStart(2, "0")}
      </span>
    </footer>
  );
}

/** A detail page's running-head meta, "02 · Scrivo · active", from the data. */
export function ProjectMeta({ slug }: { slug: string }) {
  const p = project(slug);
  return (
    <>
      {p.number} &nbsp;·&nbsp; {p.title} &nbsp;·&nbsp; <span className="filed">{statusLabel[p.status]}</span>
    </>
  );
}

/** A detail page's kicker, "02 · Scrivo", from the data. */
export function ProjectKicker({ slug }: { slug: string }) {
  const p = project(slug);
  return (
    <div className="kicker">
      {p.number} · {p.title}
    </div>
  );
}
