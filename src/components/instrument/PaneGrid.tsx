"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { projects } from "@/data/projects";

/**
 * The session's tiled panes. `j`/`k` (or arrows) move focus between panes
 * like windows in the tiling WM this site is themed after; Enter opens.
 * Plain Tab works too — focus is real browser focus, not a simulation.
 */
export function PaneGrid() {
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      )
        return;
      if (e.key !== "j" && e.key !== "k") return;
      const els = refs.current.filter(Boolean) as HTMLAnchorElement[];
      if (!els.length) return;
      const active = document.activeElement;
      const i = els.findIndex((el) => el === active);
      const next =
        e.key === "j"
          ? els[Math.min(i + 1, els.length - 1)] ?? els[0]
          : i <= 0
            ? els[0]
            : els[i - 1];
      e.preventDefault();
      next.focus();
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pane-grid">
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          href={p.href}
          className="pane"
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <span className="pane-head">
            <span className="pane-name">{p.slug}</span>
            <span>{p.tags.slice(0, 2).join(" · ")}</span>
          </span>
          <h2>{p.heading}</h2>
          <p>{p.index}</p>
          <span className="pane-stats">
            {p.stats.map((s) => (
              <span className="stat" key={s}>
                {s}
              </span>
            ))}
          </span>
        </Link>
      ))}
    </div>
  );
}
