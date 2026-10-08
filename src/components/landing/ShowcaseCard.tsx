import Link from "next/link";
import type { Project } from "@/data/projects";
import { Screen } from "@/components/rack/Screen";

/**
 * One project in the home page's first-screen row: its name and its screen,
 * on a card of the style's paper. The whole card is the link, named by the
 * title and described by the project's one-liner.
 */
export function ShowcaseCard({ p }: { p: Project }) {
  return (
    <Link
      href={p.href}
      className="card faceplate is-live"
      data-rack-stop
      aria-labelledby={`${p.slug}-card`}
      aria-describedby={`${p.slug}-card-heading`}
    >
      <h3 className="card-title" id={`${p.slug}-card`}>
        {p.title}
      </h3>
      <Screen art={p.art} tone={p.tone} className="card-screen" />
      <span className="sr-only" id={`${p.slug}-card-heading`}>
        {p.heading}
      </span>
      {/* a style's mark on the card (a seal, a sprig), drawn in its CSS */}
      <span className="card-mark" aria-hidden />
    </Link>
  );
}
