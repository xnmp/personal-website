"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { ContentBinding } from "@/lib/studio/bindings";
import { SourceTextarea } from "./SourceTextarea";
import { useStudio } from "./StudioContext";

/** Preview and source are two presentations of the same authored slot. */
export function EditableField({ binding, source, inline, paragraphClassName, paragraphStyle, children }: {
  binding: ContentBinding; source: string; inline?: boolean;
  paragraphClassName?: string; paragraphStyle?: CSSProperties; children: ReactNode;
}) {
  const studio = useStudio()!;
  const [active, setActive] = useState(false);
  if (!studio.editing || !studio.ready) return inline ? children : <div className="content-block">{children}</div>;
  if (active) {
    const Tag = inline ? "span" : "p";
    return <Tag className={inline ? "studio-region" : paragraphClassName} style={inline ? undefined : paragraphStyle}
      data-studio-slot={binding.slotId} data-studio-document={binding.documentId} data-studio-active>
      <SourceTextarea value={source} label={binding.label} inline={inline} readOnly={studio.locked}
        onActiveChange={setActive} onChange={value => studio.update(binding, value)} />
    </Tag>;
  }
  const Tag = inline ? "span" : "div";
  return <Tag className={inline ? "studio-region" : "content-block studio-preview"}
    data-studio-slot={binding.slotId} data-studio-document={binding.documentId} data-studio-editable>
    <button type="button" className="studio-edit-trigger" aria-label={`Edit ${binding.label}`}
      disabled={studio.locked}
      // Keep focus on the old field until click; its blur could otherwise move this button.
      // The newly mounted textarea takes focus when activation completes.
      onPointerDown={event => { if (event.button === 0) event.preventDefault(); }}
      onClick={() => setActive(true)} />
    {source.trim() ? children : <span className="studio-empty">Edit {binding.label}</span>}
  </Tag>;
}
