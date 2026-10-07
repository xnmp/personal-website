"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { projects } from "@/data/projects";
import { isEditable, modalOpen } from "@/lib/page-keys";
import { rank } from "@/lib/search";
import { Key } from "@/components/rack/Key";
import { Screen } from "@/components/rack/Screen";

const OPEN_EVENT = "nb-open-index";
export const THEME_EVENT = "nb-themechange";

export function openIndex() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** The rices, in cycle order — generated into rice.css from the dotfiles. */
export const RICES = ["paper", "horizon", "cosmic-dusk", "rapture"] as const;

/** A rice's name as people read it: "cosmic-dusk" is "cosmic dusk". */
export const riceLabel = (rice: string) => rice.replace(/-/g, " ");

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
  // a polite announcement; the region is empty until the first change, so
  // nothing is read out on load
  const status = document.querySelector("[data-theme-status]");
  if (status) status.textContent = `Theme: ${riceLabel(next)}`;
}

/**
 * The index: a command-palette-style list of every project, on a native modal
 * <dialog> (focus stays inside it and the page behind is inert; Esc closes it
 * and focus goes back to wherever it was). Open with `/` or Ctrl/Cmd+K; `t`
 * outside a text field cycles the theme.
 */
export function CommandIndex() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** where focus was when the index opened; closing hands it back */
  const returnTo = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      returnTo.current = document.activeElement;
    }
    d.showModal();
    inputRef.current?.focus();
  }, []);

  const close = useCallback(() => dialog.current?.close(), []);

  /** the dialog's own close event: Esc, the Close key, a backdrop click or a navigation */
  const onClosed = () => {
    setQuery("");
    setCursor(0);
    if (returnTo.current?.isConnected) returnTo.current.focus();
    returnTo.current = null;
  };

  const matches = useMemo(() => rank(projects, query), [query]);
  const listId = useId();
  const optionId = (slug: string) => `${listId}-${slug}`;
  const active = matches[cursor];

  // page-wide shortcuts: a subscription to the window's keys, not state sync
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      // another modal (the screenshot viewer) has the page: its keys, not ours
      if (modalOpen(dialog.current)) return;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (dialog.current?.open) close();
        else show();
        return;
      }
      if (isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        show();
      } else if (e.key === "t") {
        toggleTheme();
      }
    };
    const onOpenEvent = () => show();
    window.addEventListener("keydown", onGlobalKey);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onGlobalKey);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [close, show]);

  const go = (href: string) => {
    returnTo.current = null; // the next page takes focus, not the opener
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
    }
  };

  return (
    <dialog
      ref={dialog}
      className="ci-overlay"
      aria-label="Index of projects"
      onClose={onClosed}
      // the dialog box fills the viewport; a click on it (not the panel) is a click outside
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="ci-panel" onKeyDown={onKey}>
        <Screen>
        <div className="ci-head">
          <span>Index</span>
          <span>{matches.length} / {projects.length}</span>
        </div>
        {/* combobox pattern: focus stays in the input, and the option the
            arrows select is announced through aria-activedescendant */}
        <input
          ref={inputRef}
          className="ci-input"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active ? optionId(active.slug) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          placeholder="search projects, tags…"
          aria-label="Search projects"
        />
        {/* a listbox may only hold options, so the empty state sits beside it */}
        <p className="ci-empty" role="status">
          {matches.length === 0 ? "Nothing filed under that. Try a tag — rust, compiler, starcraft…" : ""}
        </p>
        <ul className="ci-list" role="listbox" id={listId} aria-label="Projects">
          {matches.map((p, i) => (
            <li
              key={p.slug}
              id={optionId(p.slug)}
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
          <span className="fine-only"><span className="k">↑↓</span> move</span>
          <span className="fine-only"><span className="k">↵</span> open</span>
          <span className="fine-only"><span className="k">esc</span> close</span>
          <span className="coarse-only">Tap a project to open it</span>
          <Key onClick={close} className="coarse-only ci-close">
            Close
          </Key>
        </div>
        </Screen>
      </div>
    </dialog>
  );
}
