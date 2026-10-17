"use client";

import { useCallback, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { menuPlacement, nextItem } from "@/lib/menu";

const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
const focusChecked = (menu: HTMLElement) => (menu.querySelector<HTMLElement>('[aria-checked="true"]') ?? items(menu)[0])?.focus();
const subscribeToHost = () => () => {};
const readHost = () => document.body;
const serverHost = () => null;

type Props<Id extends string> = {
  options: readonly { id: Id; name: string }[];
  current: string;
  label: string;
  triggerLabel: string;
  triggerClass: string;
  onChoose: (id: Id) => void;
  children: ReactNode;
};

/** Shared native popover: radio selection, bounded placement, and APG keyboard focus. */
export function ChoiceMenu<Id extends string>({ options, current, label, triggerLabel, triggerClass, onChoose, children }: Props<Id>) {
  const [open, setOpen] = useState(false);
  // Popovers need the root theme surfaces, outside header-specific tokens.
  // The server snapshot also keeps the first hydration render identical.
  const host = useSyncExternalStore(subscribeToHost, readHost, serverHost);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const place = useCallback((menu: HTMLElement) => {
    const button = trigger.current;
    if (!button) return;
    const at = menuPlacement(button.getBoundingClientRect(), menu.getBoundingClientRect(), {
      width: document.documentElement.clientWidth, height: window.innerHeight,
    });
    menu.style.top = `${at.top}px`;
    menu.style.left = `${at.left}px`;
    menu.style.maxHeight = `${at.maxHeight}px`;
    menu.style.visibility = "visible";
  }, []);

  const wire = useCallback((menu: HTMLDivElement | null) => {
    if (!menu) return;
    const close = () => menu.hidePopover();
    const before = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      // Closed popovers have no box; measure once open, before moving focus.
      menu.style.visibility = "hidden";
      menu.style.maxHeight = "none";
    };
    const toggled = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (isOpen) {
        place(menu);
        window.addEventListener("resize", close);
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
  }, [place]);

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = items(event.currentTarget);
    const next = nextItem(event.key, all.indexOf(document.activeElement as HTMLElement), all.length);
    if (next !== null) {
      event.preventDefault();
      all[next].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.currentTarget.hidePopover();
      trigger.current?.focus();
    }
  };
  const onButtonKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const menu = document.getElementById(menuId);
    if (!["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key) || !menu) return;
    event.preventDefault();
    if (!menu.matches(":popover-open")) menu.showPopover();
    // Synchronous focus keeps a rapid second keystroke inside the menu.
    place(menu);
    focusChecked(menu);
  };

  return (
    <>
      <button ref={trigger} type="button" className={`key ${triggerClass}`} popoverTarget={menuId}
        aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={triggerLabel} onKeyDown={onButtonKey}>
        {children}
      </button>
      {host && createPortal(<div id={menuId} ref={wire} popover="auto" role="menu" aria-label={label}
        className="style-menu faceplate" onKeyDown={onMenuKey}
        onBlur={(event) => {
          const menu = event.currentTarget;
          if (!menu.contains(event.relatedTarget as Node | null) && menu.matches(":popover-open")) menu.hidePopover();
        }}>
        {options.map((option) => (
          <button key={option.id} type="button" role="menuitemradio" aria-checked={current === option.id} tabIndex={-1}
            className="key style-opt" data-tone={current === option.id ? "signal" : undefined}
            onClick={(event) => {
              onChoose(option.id);
              event.currentTarget.closest<HTMLElement>('[role="menu"]')?.hidePopover();
              trigger.current?.focus();
            }}>
            <span>{option.name}</span>
          </button>
        ))}
      </div>, host)}
    </>
  );
}
