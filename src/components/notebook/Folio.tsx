import { Cap } from "@/components/rack/Key";
import { projects } from "@/data/projects";

/** The bottom plate of a detail page: module number and the way back. */
export function Folio({ number }: { number: string }) {
  return (
    <footer className="folio">
      <span className="fine-only">
        Press <Cap>/</Cap> for the other modules
      </span>
      <span>
        {number} / {String(projects.length).padStart(2, "0")}
      </span>
    </footer>
  );
}
