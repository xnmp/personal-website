"use client";

import { createContext, memo, useContext, useState } from "react";
import { MarkdownRenderer, type MarkdownProps, type MarkdownRootProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { editSource, type SourceEdit } from "@/lib/studio/source-edits";
import { SourceTextarea } from "./SourceTextarea";
import { useStudio } from "./StudioContext";

type Buffer = { source: string; rendered: string; fields?: Record<string, string | number>; edits: Record<number, SourceEdit> };
type EditingContext = { binding: ContentBinding; buffer: Buffer; readOnly: boolean; inline: boolean; update: (id: number, edit: SourceEdit) => void };
const EditingContext = createContext<EditingContext | null>(null);
const PreviewMarkdown = memo(MarkdownRenderer);

function EditableMarkdownRoot({ node, children, className, style, ...props }: MarkdownRootProps) {
  const editing = useContext(EditingContext)!;
  const [active, setActive] = useState(false);
  const id = node?.data?.studioRoot ?? 0;
  const range = node?.data?.studioRange;
  const tag = node?.data?.studioRootTag ?? "p";
  const editable = range && !["hr", "img"].includes(tag);
  const label = id === 0 ? editing.binding.label : `${editing.binding.label} · part ${id + 1}`;
  const control = editable ? <SourceTextarea value={editing.buffer.edits[id]?.value ?? editing.buffer.source.slice(range.start, range.end)}
    label={label} inline={editing.inline} readOnly={editing.readOnly} onActiveChange={setActive}
    onChange={value => editing.update(id, { ...range, value })} /> : children;
  const content = editable && ["ul", "ol"].includes(tag) ? <li className="studio-list-source">{control}</li>
    : editable && tag === "table" ? <tbody><tr><td>{control}</td></tr></tbody> : control;
  const Tag = tag as "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "ul" | "ol" | "pre" | "blockquote" | "table" | "hr" | "img" | "section";
  return <Tag {...props} className={[className, node?.data?.studioParagraphClassName].filter(Boolean).join(" ") || undefined}
    style={{ ...style, ...node?.data?.studioParagraphStyle }} data-studio-slot={editing.binding.slotId}
    data-studio-document={editing.binding.documentId} data-studio-part={id}
    data-studio-editable={editable && !active || undefined} data-studio-active={editable && active || undefined}>
    {["hr", "img"].includes(tag) ? undefined : content}
  </Tag>;
}

export function EditableMarkdown({ binding, markdown }: { binding: ContentBinding; markdown: MarkdownProps }) {
  const studio = useStudio()!;
  const source = studio.value(binding);
  let rendered = source;
  let fields = binding.fields;
  try { rendered = interpolateContent(source, fields ?? {}); } catch { fields = undefined; }
  const editing = studio.editing && studio.ready;
  const [buffer, setBuffer] = useState<Buffer | null>(null);
  // Keep source ranges and controls stable until the explicit mode toggle.
  // Clearing a paragraph never removes the next field during a pointer action.
  if (editing !== Boolean(buffer)) setBuffer(editing ? { source, rendered, fields, edits: {} } : null);
  if (!editing || !buffer) return <MarkdownRenderer {...markdown} text={rendered} />;
  const context: EditingContext = {
    binding, buffer, readOnly: studio.locked, inline: Boolean(markdown.inline),
    update: (id, edit) => {
      const next = { ...buffer, edits: { ...buffer.edits, [id]: edit } };
      setBuffer(next);
      studio.update(binding, editSource(next.source, Object.values(next.edits)));
    },
  };
  return <EditingContext.Provider value={context}>
    <PreviewMarkdown {...markdown} text={buffer.rendered} rootComponent={EditableMarkdownRoot}
      sourceValue={buffer.source} sourceFields={buffer.fields} />
  </EditingContext.Provider>;
}
