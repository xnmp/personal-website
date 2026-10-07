import Link from "next/link";
import { statusLabel, type Project } from "@/data/projects";
import { Led } from "./Led";
import { Screen } from "./Screen";

/**
 * One project, slotted into the rack: a live faceplate with a lit screen. The
 * whole plate is the link, named by the project's title (its heading) and
 * described by its one-line summary, so it reads as "Scrivo, link" rather
 * than every word on the plate.
 */
export function ModuleCard({ p }: { p: Project }) {
  return (
    <Link
      href={p.href}
      className="module faceplate is-live"
      data-rack-stop
      aria-labelledby={`${p.slug}-title`}
      aria-describedby={`${p.slug}-heading`}
    >
      {/* the sheet hangs on a pin in its status's colour */}
      <Led status={p.status} className="sheet-pin" />
      <div className="module-inner">
        <span className="module-top silk">
          <span className="module-num">{p.number}</span>
          <span className="module-status">{statusLabel[p.status]}</span>
        </span>
        <Screen art={p.art} tone={p.tone} />
        <div className="module-body">
          <h3 className="module-title" id={`${p.slug}-title`}>
            {p.title}
          </h3>
          <span className="module-heading" id={`${p.slug}-heading`}>
            {p.heading}
          </span>
        </div>
        <hr className="engraved" />
        <span className="module-stats silk">
          {p.stats.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </span>
      </div>
    </Link>
  );
}
