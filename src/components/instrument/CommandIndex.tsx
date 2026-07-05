"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { projects } from "@/data/projects";

const OPEN_EVENT = "nb-open-index";
const THEME_EVENT = "nb-themechange";

export function openIndex() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** The rices, in cycle order — generated into rice.css from the dotfiles. */
export const RICES = ["paper", "horizon", "cosmic-dusk", "rapture"] as const;

export function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.rice ?? "paper";
  const next = RICES[(RICES.indexOf(current as (typeof RICES)[number]) + 1) % RICES.length];
  root.dataset.rice = next;
  try {
    localStorage.setItem("nb-rice", next);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

/**
 * The notebook's index: a command-palette-style overlay listing every entry.
 * Open with `/` or Ctrl/Cmd+K. `t` turns the desk lamp (theme) on and off.
 */
export function CommandIndex() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.index, p.number, ...p.tags].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "t") {
        toggleTheme();
      } else if (e.key === "Escape") {
        close();
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onGlobalKey);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onGlobalKey);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  if (!open) return null;

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp" || (e.key === "k" && e.ctrlKey)) {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && matches[cursor]) {
      e.preventDefault();
      go(matches[cursor].href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      className="ci-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Index of entries"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="ci-panel" onKeyDown={onKey}>
        <div className="ci-head">
          <span>Index of entries</span>
          <span>{matches.length} / {projects.length}</span>
        </div>
        <input
          ref={inputRef}
          className="ci-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the notebook…"
          aria-label="Search entries"
        />
        <ul className="ci-list" role="listbox">
          {matches.length === 0 && (
            <li className="ci-empty">
              Nothing filed under that. Try a tag — rust, compiler, starcraft…
            </li>
          )}
          {matches.map((p, i) => (
            <li
              key={p.slug}
              className="ci-item"
              role="option"
              aria-selected={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => go(p.href)}
            >
              <span className="ci-num">{p.number}</span>
              <span className="ci-title">{p.title}</span>
              <span className="ci-desc">{p.index}</span>
            </li>
          ))}
        </ul>
        <div className="ci-foot">
          <span><span className="k">↑↓</span> move</span>
          <span><span className="k">↵</span> open</span>
          <span><span className="k">esc</span> close</span>
          <span><span className="k">t</span> theme</span>
        </div>
      </div>
    </div>
  );
}
