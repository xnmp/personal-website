"use client";

import { useSyncExternalStore } from "react";
import { Cap } from "@/components/rack/Key";
import { heldServerSnapshot, heldSnapshot, subscribe } from "./keyboard";
import { chordFor } from "./shortcuts";
import { useOS } from "./useOS";

/** Modifier symbols and the backtick are drawn small in the cap face; they are
 * printed larger so they read at the size of a letter. */
const GLYPH = /^[⌘⌃⌥⇧`]$/;

/** A chord printed as keycaps that depress while you hold the real keys. */
export function LiveCaps({ chord, className }: { chord: string[]; className?: string }) {
  const held = useSyncExternalStore(subscribe, heldSnapshot, heldServerSnapshot);
  const caps = chordFor(chord, useOS());
  return (
    <span className={["chord", className].filter(Boolean).join(" ")}>
      <span className="sr-only">{caps.map((c) => c.name).join(" + ")}</span>
      {caps.map((cap, i) => (
        <span key={cap.key} className="chord-part" aria-hidden>
          {i > 0 ? <span className="chord-plus">+</span> : null}
          <Cap down={held.has(cap.key)}>
            {GLYPH.test(cap.legend) ? <span className="cap-glyph">{cap.legend}</span> : cap.legend}
          </Cap>
        </span>
      ))}
    </span>
  );
}
