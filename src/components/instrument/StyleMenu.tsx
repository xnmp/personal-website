"use client";

import { useId, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { menuPlacement, nextItem } from "@/lib/menu";
import { DEFAULT_STYLE, STYLE_EVENT, STYLE_KEY, STYLES, sceneArt, styleName, type StyleId } from "@/lib/styles";

function subscribe(cb: () => void) {
  window.addEventListener(STYLE_EVENT, cb);
  return () => window.removeEventListener(STYLE_EVENT, cb);
}
const readStyle = () => document.documentElement.dataset.style ?? DEFAULT_STYLE;

/** Dress the page in a style and remember it (the head script reapplies it
 *  before paint on the next load, see app/layout.tsx). */
export function applyStyle(id: StyleId) {
  const root = document.documentElement;
  root.dataset.sceneArt = sceneArt(id);
  root.dataset.style = id;
  try {
    localStorage.setItem(STYLE_KEY, id);
  } catch {
    /* private mode: the choice lasts this page */
  }
  window.dispatchEvent(new Event(STYLE_EVENT));
}

const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
const focusChecked = (menu: HTMLElement) => (menu.querySelector<HTMLElement>('[aria-checked="true"]') ?? items(menu)[0])?.focus();

/**
 * The art-direction menu, in the masthead beside the theme key: a menu
 * button (WAI-ARIA APG) whose menu lists the styles as radio items, the
 * current one checked and printed on the signal tile. The menu is a popover
 * (the browser dismisses it on Escape or a click elsewhere, and lays it over
 * everything), opened on the checked item; arrows, Home and End move,
 * Enter or Space chooses, and focus leaving the menu closes it. Not part of
 * the `t` cycle: the rice is the screens' colour, the style everything
 * round them.
 */
export function StyleMenu() {
  const current = useSyncExternalStore(subscribe, readStyle, () => "");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  if (STYLES.length < 2) return null;

  const button = () => document.querySelector<HTMLButtonElement>(`[popovertarget="${CSS.escape(menuId)}"]`);

  // the popover's own toggle events: placed before it shows, focused into
  // once it has; closed, its button says so
  const wire = (menu: HTMLDivElement | null) => {
    if (!menu) return;
    const close = () => menu.hidePopover();
    const before = (e: Event) => {
      const b = button();
      if ((e as ToggleEvent).newState !== "open" || !b) return;
      const at = menuPlacement(b.getBoundingClientRect(), window.scrollY, document.documentElement.clientWidth);
      menu.style.top = `${at.top}px`;
      menu.style.right = `${at.right}px`;
    };
    const toggled = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === "open";
      setOpen(isOpen);
      // laid out against the page as it was: a resize closes it
      if (isOpen) {
        window.addEventListener("resize", close);
        // (unless a key that opened it has already moved focus in)
        if (!menu.contains(document.activeElement)) focusChecked(menu);
      } else window.removeEventListener("resize", close);
    };
    menu.addEventListener("beforetoggle", before);
    menu.addEventListener("toggle", toggled);
    return () => {
      menu.removeEventListener("beforetoggle", before);
      menu.removeEventListener("toggle", toggled);
      window.removeEventListener("resize", close);
    };
  };

  const choose = (menu: HTMLElement, id: StyleId) => {
    applyStyle(id);
    menu.hidePopover();
    button()?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = items(e.currentTarget);
    const to = nextItem(e.key, all.indexOf(document.activeElement as HTMLElement), all.length);
    if (to !== null) {
      e.preventDefault();
      all[to].focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.currentTarget.hidePopover();
      button()?.focus();
    }
  };

  // From the keyboard (Enter, Space, and the arrows, as on a native select)
  // the menu opens here and focus goes straight in: the popover's toggle
  // event comes a task later, and a key pressed before it would land on the
  // button. A click opens it through popovertarget.
  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const menu = document.getElementById(menuId);
    if (!["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key) || !menu) return;
    e.preventDefault();
    if (!menu.matches(":popover-open")) menu.showPopover();
    focusChecked(menu);
  };

  return (
    <>
      <button
        type="button"
        className="key style-key"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={current ? `Art direction: ${styleName(current)}` : "Art direction"}
        onKeyDown={onButtonKey}
      >
        <span className="style-name fine-only" suppressHydrationWarning>
          {current ? styleName(current) : "style"}
        </span>
        <span className="style-word coarse-only">style</span>
        {/* on a phone, a palette: no room on the masthead's row for a word */}
        <svg className="style-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <path
            d="M10 2.5a7.5 7.5 0 1 0 0 15c1.1 0 1.6-.8 1.3-1.7-.3-1-.1-2 1.1-2h2.1c1.7 0 3-1.4 3-3.1C17.5 6.1 14.2 2.5 10 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="6.4" cy="9" r="1.25" fill="currentColor" />
          <circle cx="9" cy="5.9" r="1.25" fill="currentColor" />
          <circle cx="12.8" cy="6.6" r="1.25" fill="currentColor" />
        </svg>
        <span className="style-caret" aria-hidden>
          ▾
        </span>
      </button>
      <div
        id={menuId}
        ref={wire}
        popover="auto"
        role="menu"
        aria-label="Art direction"
        className="style-menu faceplate"
        onKeyDown={onMenuKey}
        onBlur={(e) => {
          // focus left the menu (Tab, Shift+Tab, a click elsewhere): close
          const menu = e.currentTarget;
          if (!menu.contains(e.relatedTarget as Node | null) && menu.matches(":popover-open")) menu.hidePopover();
        }}
      >
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="menuitemradio"
            aria-checked={current === s.id}
            tabIndex={-1}
            className="key style-opt"
            data-tone={current === s.id ? "signal" : undefined}
            onClick={(e) => choose(e.currentTarget.closest<HTMLElement>('[role="menu"]')!, s.id)}
          >
            <span>{s.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
