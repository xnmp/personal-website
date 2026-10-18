import { EditableText } from "@/components/studio/EditableText";
import { bindField } from "@/lib/studio/bindings";
import { readContent } from "@/lib/content.server";
import { EditableLink } from "@/components/studio/EditableLink";
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
  const content = readContent(`projects/${p.slug}`);
  return (
    <EditableLink block
      href={p.href}
      className="module faceplate is-live"
      data-rack-stop
      aria-labelledby={`${p.slug}-title`}
      aria-describedby={`${p.slug}-heading`}
      data-shelf={p.shelf}
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
            <EditableText binding={bindField(content, ["title"])}>{p.title}</EditableText>
          </h3>
          <span className="module-heading" id={`${p.slug}-heading`}>
            <EditableText binding={bindField(content, ["heading"])}>{p.heading}</EditableText>
          </span>
        </div>
        <hr className="engraved" />
        <span className="module-stats silk">
          {p.stats.map((s, index) => (
            <span key={s}><EditableText binding={bindField(content, ["stats", index])}>{s}</EditableText></span>
          ))}
        </span>
      </div>
    </EditableLink>
  );
}
