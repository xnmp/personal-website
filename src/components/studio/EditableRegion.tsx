"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import type { ContentBinding } from "@/lib/studio/bindings";
import { useStudio } from "./StudioContext";
import { EditableMarkdown } from "./EditableMarkdown";
import { ForOS } from "@/components/launch/ForOS";
import { editShortcutText } from "@/lib/studio/shortcuts";

function EditableScalar({ binding, children, shortcuts }: { binding: ContentBinding; children: ReactNode; shortcuts: boolean }) {
  const studio = useStudio()!;
  const value = studio.value(binding);
  const [snapshot, setSnapshot] = useState<{ value: string; content: ReactNode } | null>(null);
  const [epoch, setEpoch] = useState(0);
  const element = useRef<HTMLSpanElement>(null);
  const previousInput = useRef({ source: value, display: "" });
  const canEdit = studio.editing && studio.ready && !studio.locked;
  const content = value === binding.value ? children : shortcuts ? <ForOS>{value}</ForOS> : value;
  const active = Boolean(snapshot);
  useLayoutEffect(() => {
    if (!active || !canEdit || !element.current) return;
    previousInput.current = { source: snapshot!.value, display: element.current.innerText };
    element.current.focus({ preventScroll: true });
  }, [active, canEdit, snapshot]);
  const close = (cancel = false) => {
    if (!snapshot) return;
    if (cancel) studio.update(binding, snapshot.value);
    setSnapshot(null);
    setEpoch((current) => current + 1);
  };
  return <span className="studio-region" data-studio-slot={binding.slotId} data-studio-document={binding.documentId}
    data-studio-editable={canEdit && !snapshot || undefined} data-studio-active={canEdit && snapshot ? true : undefined}
    role={canEdit && !snapshot ? "button" : undefined}
    aria-label={canEdit && !snapshot ? `Edit ${binding.label}` : undefined} tabIndex={canEdit && !snapshot ? 0 : undefined}
    onClickCapture={(event) => {
      if (!canEdit || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (!snapshot) setSnapshot({ value, content });
    }}
    onKeyDown={(event) => {
      if (snapshot && event.key === "Escape") { event.preventDefault(); close(true); }
      else if (snapshot && event.key === "Enter") { event.preventDefault(); close(); }
      else if (canEdit && !snapshot && ["Enter", "F2", " "].includes(event.key)) { event.preventDefault(); setSnapshot({ value, content }); }
    }}><span key={epoch} ref={element} className="studio-text"
      role={canEdit && snapshot ? "textbox" : undefined} aria-label={canEdit && snapshot ? binding.label : undefined}
      contentEditable={canEdit && snapshot ? "plaintext-only" : undefined} suppressContentEditableWarning
      onInput={(event) => {
        const display = event.currentTarget.innerText;
        const next = shortcuts ? editShortcutText(previousInput.current.source, previousInput.current.display, display) : display;
        previousInput.current = { source: next, display };
        studio.update(binding, next);
      }} onBlur={() => close()}
    >{snapshot ? snapshot.content : content}</span></span>;
}

export function EditableRegion({ binding, markdown, children, shortcuts = false }: { binding: ContentBinding; markdown?: MarkdownProps; inline?: boolean; children: ReactNode; shortcuts?: boolean }) {
  const studio = useStudio();
  if (!studio) return children;
  return markdown ? <EditableMarkdown binding={binding} markdown={markdown} /> : <EditableScalar binding={binding} shortcuts={shortcuts}>{children}</EditableScalar>;
}
