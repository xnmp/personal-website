"use client";

import { memo, useCallback, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { MarkdownRenderer, type MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { useStudio } from "./StudioContext";

// Typing in one block must not parse/highlight every other block on a long page.
const PreviewMarkdown = memo(MarkdownRenderer);

function SourceInput({ binding, value, inline, className, update, close }: {
  binding: ContentBinding; value: string; inline: boolean; className?: string;
  update: (value: string) => void; close: () => void;
}) {
  const input = useRef<HTMLSpanElement>(null);
  const initial = useRef(value);
  useLayoutEffect(() => {
    const element = input.current!;
    element.textContent = initial.current;
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);
  return <span ref={input} className={`studio-input ${className ?? ""}`} data-inline={inline || undefined}
    role="textbox" aria-label={binding.label} aria-multiline={!inline}
    contentEditable="plaintext-only" suppressContentEditableWarning spellCheck
    onInput={(event) => update(event.currentTarget.innerText.replace(/\r\n/g, "\n"))}
    onBlur={close}
    onClick={(event) => event.preventDefault()}
    onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); update(initial.current); close(); }
      if (event.key === "Enter" && (inline || event.metaKey || event.ctrlKey)) { event.preventDefault(); close(); }
    }} />;
}

export function EditableRegion({ binding, markdown, inline = false, children }: {
  binding: ContentBinding; markdown?: MarkdownProps; inline?: boolean; children: ReactNode;
}) {
  const studio = useStudio();
  const [active, setActive] = useState(false);
  const canEdit = Boolean(studio?.editing && studio.ready && !studio.locked);
  const attributes = useCallback((first = true): HTMLAttributes<HTMLElement> & Record<string, unknown> => ({
    "data-studio-slot": binding.slotId, "data-studio-document": binding.documentId,
    "data-studio-editable": canEdit || undefined,
    role: canEdit && !active && first ? "button" : undefined,
    "aria-label": canEdit && !active && first ? `Edit ${binding.label}` : undefined,
    tabIndex: canEdit && !active && first ? 0 : undefined,
    onClickCapture: (event) => {
      if (!canEdit || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setActive(true);
    },
    onKeyDown: (event) => {
      if (canEdit && !active && ["Enter", "F2", " "].includes(event.key)) { event.preventDefault(); setActive(true); }
    },
  }), [binding.slotId, binding.documentId, binding.label, canEdit, active]);
  if (!studio) return children;
  const value = studio.value(binding);
  const isInline = inline || Boolean(markdown?.inline);
  let rendered = value;
  if (markdown && binding.fields) {
    try { rendered = interpolateContent(value, binding.fields); } catch { /* Invalid drafts remain editable; save reports validation errors. */ }
  }
  if (active && canEdit) return <SourceInput binding={binding} value={value} inline={isInline} className={markdown?.paragraphClassName}
    update={(next) => studio.update(binding, next)} close={() => setActive(false)} />;
  if (markdown && !isInline && value) return <PreviewMarkdown {...markdown} text={rendered} rootProps={attributes} />;
  return <span {...attributes()} className="studio-region">
    {markdown ? <PreviewMarkdown {...markdown} text={rendered} /> : value === binding.value ? children : value}
    {canEdit && !value && <span className="studio-empty">Empty text</span>}
  </span>;
}
