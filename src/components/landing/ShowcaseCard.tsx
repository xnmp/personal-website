import type { CSSProperties } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { Screen } from "@/components/rack/Screen";

/**
 * One project in the home page's first-screen row: its name and its screen,
 * on a card of the style's paper. The whole card is the link, named by the
 * title and described by the project's one-liner. A style dresses a card
 * by what it is (its shelf, its glyph, its art's bounds), never by which
 * project it is, so the row takes any project.
 */
export function ShowcaseCard({ p }: { p: Project }) {
  return (
    <Link
      href={p.href}
      className="card faceplate is-live"
      data-rack-stop
      aria-labelledby={`${p.slug}-card`}
      aria-describedby={`${p.slug}-card-heading`}
      data-shelf={p.shelf}
      style={{ "--glyph": JSON.stringify(p.glyph) } as CSSProperties}
    >
      <h3 className="card-title" id={`${p.slug}-card`}>
        {p.title}
      </h3>
      <Screen art={p.art} tone={p.tone} className="card-screen" />
      <span className="sr-only" id={`${p.slug}-card-heading`}>
        {p.heading}
      </span>
      {/* a style's mark on the card (a seal, a sprig), drawn in its CSS;
          a seal may stamp the project's glyph (content: var(--glyph)) */}
      <span className="card-mark" aria-hidden />
    </Link>
  );
}
