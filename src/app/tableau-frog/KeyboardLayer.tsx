"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Cmd {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["?"], label: "this shortcuts overlay" },
  { keys: ["Ctrl", "K"], label: "command palette (navigate sections)" },
  { keys: ["Ctrl", "Shift", "P"], label: "command palette" },
  { keys: ["G", "then", "I"], label: "go to Investigate" },
  { keys: ["G", "then", "D"], label: "go to the live demo" },
  { keys: ["Esc"], label: "close overlays" },
];

export default function KeyboardLayer() {
  const [shortcuts, setShortcuts] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const gPending = useRef(false);

  const commands = useMemo<Cmd[]>(
    () => [
      { id: "top", label: "go: top", hint: "hero", run: () => scrollTo("tf-top") },
      { id: "demo", label: "go: live lens demo", hint: "demo", run: () => scrollTo("demo") },
      { id: "how", label: "go: how the lens works", hint: "lens", run: () => scrollTo("lens") },
      { id: "investigate", label: "go: investigate", hint: "AI", run: () => scrollTo("investigate") },
      { id: "assistant", label: "go: AI assistant", hint: "Ctrl+J", run: () => scrollTo("assistant") },
      { id: "ml", label: "go: built-in ML", hint: "forest", run: () => scrollTo("ml") },
      { id: "hack", label: "go: hack it", hint: "plugins", run: () => scrollTo("hack") },
      { id: "stats", label: "go: the numbers", hint: "stats", run: () => scrollTo("stats") },
      { id: "start", label: "go: quickstart", hint: "clone", run: () => scrollTo("quickstart") },
      { id: "github", label: "open: source on GitHub", hint: "↗", run: () => window.open("https://github.com", "_blank") },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.replace(/^go:\s*/i, "").trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
  }, [query, commands]);

  const openPalette = useCallback(() => {
    setShortcuts(false);
    setPalette(true);
    setQuery("");
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 20);
  }, []);

  const close = useCallback(() => {
    setPalette(false);
    setShortcuts(false);
  }, []);

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const n = el as HTMLElement | null;
      return !!n && (n.tagName === "INPUT" || n.tagName === "TEXTAREA" || n.isContentEditable);
    };

    const onKey = (e: KeyboardEvent) => {
      // palette open/close
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || (e.shiftKey && (e.key === "P" || e.key === "p")))) {
        e.preventDefault();
        if (palette) close();
        else openPalette();
        return;
      }
      if (e.key === "Escape") {
        close();
        return;
      }
      if (isEditable(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setPalette(false);
        setShortcuts((s) => !s);
        return;
      }
      // vim-style `g` then a letter to jump
      if (gPending.current) {
        gPending.current = false;
        const map: Record<string, string> = { i: "investigate", d: "demo", m: "ml", h: "hack", s: "stats", a: "assistant" };
        const target = map[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          scrollTo(target);
        }
        return;
      }
      if (e.key === "g" || e.key === "G") {
        gPending.current = true;
        window.setTimeout(() => (gPending.current = false), 900);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette, close, openPalette]);

  const onPaletteKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) {
        cmd.run();
        close();
      }
    }
  };

  return (
    <>
      <button className="tf-hintchip" onClick={openPalette} aria-label="Open command palette">
        press <span className="tf-kbd">?</span> for shortcuts
      </button>

      {shortcuts && (
        <div className="tf-overlay" onClick={close}>
          <div className="tf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
            <div className="tf-modal-head">Keyboard shortcuts — same muscle memory as the app</div>
            <div className="tf-shortcuts">
              {SHORTCUTS.map((s, i) => (
                <div className="tf-shortcut" key={i}>
                  <span>{s.label}</span>
                  <span className="keys">
                    {s.keys.map((k, j) =>
                      k === "then" ? (
                        <span key={j} style={{ color: "var(--ink-3)", alignSelf: "center" }}>then</span>
                      ) : (
                        <span className="tf-kbd" key={j}>{k}</span>
                      ),
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {palette && (
        <div className="tf-overlay" onClick={close}>
          <div className="tf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
            <input
              ref={inputRef}
              className="tf-palette-input"
              placeholder="Type a command…  try 'go: investigate'"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onPaletteKey}
            />
            <div className="tf-palette-list">
              {filtered.length === 0 && (
                <div className="tf-palette-item"><span className="hint">no matches</span></div>
              )}
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  className={`tf-palette-item${i === active ? " active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.run();
                    close();
                  }}
                >
                  <span className="cmd">{c.label}</span>
                  <span className="hint">{c.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
