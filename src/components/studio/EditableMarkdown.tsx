"use client";

import { createContext, memo, useContext, useLayoutEffect, useRef, useState } from "react";
import { MarkdownRenderer, type MarkdownProps, type MarkdownRootProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { applyTextPatches, type TextPatch } from "@/lib/studio/patches";
import { markdownCode, markdownText } from "@/lib/studio/text";
import { useStudio } from "./StudioContext";

type Patch = TextPatch;
type Caret = { node: Node; offset: number };
type Session = { source: string; rendered: string; active: number; root: number; patches: Record<number, Patch>; caret?: Caret };
type EditingContext = {
  binding: ContentBinding; source: string; session: Session | null; canEdit: boolean; inline: boolean;
  start: (root: number, leaf: HTMLElement, point?: { x: number; y: number }) => void;
  input: (id: number, patch: Patch) => void;
  close: (id: number, cancel?: boolean) => void;
};
const EditingContext = createContext<EditingContext | null>(null);
const PreviewMarkdown = memo(MarkdownRenderer);
const labelFor = (label: string, root: number) => root === 0 ? label : `${label} · part ${root + 1}`;
const patched = (source: string, patches: Record<number, Patch>) => applyTextPatches(source, Object.values(patches));

/** A paragraph/heading/list retains its exact rendered descendants on activation. */
function EditableMarkdownRoot({ node, children, className, style, ...props }: MarkdownRootProps) {
  const editing = useContext(EditingContext)!;
  const index = node?.data?.studioRoot ?? 0;
  const active = editing.session?.root === index;
  const canEdit = editing.canEdit && Boolean(node?.data?.studioHasText);
  const tag = node?.data?.studioRootTag ?? "p";
  const label = labelFor(editing.binding.label, index);
  const activate = (element: HTMLElement, target: EventTarget, point?: { x: number; y: number }) => {
    const clicked = target instanceof Element ? target.closest<HTMLElement>("[data-studio-text]") : null;
    const leaf = clicked && element.contains(clicked) ? clicked : element.querySelector<HTMLElement>("[data-studio-text]");
    if (leaf) editing.start(index, leaf, point);
  };
  const attributes = {
    ...props,
    className: [className, node?.data?.studioParagraphClassName].filter(Boolean).join(" ") || undefined,
    style: { ...style, ...node?.data?.studioParagraphStyle },
    "data-studio-slot": editing.binding.slotId, "data-studio-document": editing.binding.documentId,
    "data-studio-part": index, "data-studio-editable": canEdit && !active || undefined,
    "data-studio-active": active && editing.canEdit || undefined,
    role: canEdit && !active ? "button" : undefined,
    "aria-label": canEdit && !active ? `Edit ${label}` : undefined,
    tabIndex: canEdit && !active ? 0 : undefined,
    onPointerDownCapture: (event: React.PointerEvent<HTMLElement>) => {
      if (!canEdit || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const leaf = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-studio-text]") : null;
      if (leaf && Number(leaf.dataset.studioText) === editing.session?.active) return;
      // Native pointer handling starts drag selection when the text is hit.
      // Only the pencil/empty-space button needs to take over focus itself.
      if (!leaf) event.preventDefault();
      activate(event.currentTarget, event.target, { x: event.clientX, y: event.clientY });
    },
    onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
      if (canEdit && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (canEdit && !active && ["Enter", "F2", " "].includes(event.key)) { event.preventDefault(); activate(event.currentTarget, event.currentTarget); }
    },
  };
  const Tag = tag as "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "ul" | "ol" | "pre" | "blockquote" | "table" | "hr" | "img" | "section";
  return <Tag {...attributes}>{["hr", "img"].includes(tag) ? undefined : children}</Tag>;
}

/** No source syntax or styling is substituted when this leaf receives focus. */
function EditableMarkdownText({ node, children }: MarkdownRootProps) {
  const editing = useContext(EditingContext)!;
  const text = node!.data!.studioText!;
  const element = useRef<HTMLSpanElement>(null);
  const active = editing.session?.active === text.id;
  const label = labelFor(editing.binding.label, text.root);
  const original = editing.source.slice(text.start, text.end);
  const multiline = text.kind !== "code" ? !editing.inline : /^ {0,3}(`{3,}|~{3,})/.test(original);
  useLayoutEffect(() => {
    if (!active || !element.current || !editing.canEdit) return;
    element.current.focus({ preventScroll: true });
    const selection = window.getSelection();
    const caret = document.createRange();
    const point = editing.session?.caret;
    if (point && element.current.contains(point.node)) caret.setStart(point.node, point.offset);
    else { caret.selectNodeContents(element.current); caret.collapse(false); }
    selection?.removeAllRanges();
    selection?.addRange(caret);
  }, [active, editing.canEdit, editing.session?.caret]);
  return <span key={text.epoch} ref={element} className="studio-text" data-studio-text={text.id}
    role={active && editing.canEdit ? "textbox" : undefined} aria-label={active && editing.canEdit ? label : undefined}
    aria-multiline={active ? multiline : undefined}
    contentEditable={active && editing.canEdit ? "plaintext-only" : undefined} suppressContentEditableWarning
    spellCheck={active ? text.kind !== "code" : undefined}
    onInput={(event) => {
      const value = event.currentTarget.innerText.replace(/\r\n/g, "\n");
      const replacement = text.kind === "code" ? value ? markdownCode(multiline ? value : value.replace(/\n/g, " "), original) : "" : markdownText(value);
      const range = !value && text.emptyRange ? text.emptyRange : { start: text.start, end: text.end };
      editing.input(text.id, { ...range, value: replacement, containers: text.containers });
    }}
    onBlur={() => editing.close(text.id)}
    onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); editing.close(text.id, true); }
      else if (event.key === "Enter" && (!multiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); editing.close(text.id); }
    }}>{children}</span>;
}

export function EditableMarkdown({ binding, markdown }: { binding: ContentBinding; markdown: MarkdownProps }) {
  const studio = useStudio()!;
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [epoch, setEpoch] = useState(0);
  const source = studio.value(binding);
  let rendered = source;
  let fields = binding.fields;
  try { rendered = interpolateContent(source, fields ?? {}); } catch { fields = undefined; }
  const changeSession = (next: Session | null) => { sessionRef.current = next; setSession(next); };
  const context: EditingContext = {
    binding, source: session?.source ?? source, session,
    canEdit: studio.editing && studio.ready && !studio.locked, inline: Boolean(markdown.inline),
    start: (root, leaf, point) => {
      const id = Number(leaf.dataset.studioText);
      const current = sessionRef.current;
      if (current?.active === id) return;
      const range = point && typeof document.caretRangeFromPoint === "function" ? document.caretRangeFromPoint(point.x, point.y) : null;
      const caret = range && leaf.contains(range.startContainer) ? { node: range.startContainer, offset: range.startOffset } : undefined;
      changeSession({ ...(current ?? { source, rendered, patches: {} }), active: id, root, caret });
    },
    input: (id, patch) => {
      const current = sessionRef.current;
      if (!current || current.active !== id) return;
      const next = { ...current, patches: { ...current.patches, [id]: patch } };
      studio.update(binding, patched(next.source, next.patches));
      changeSession(next);
    },
    close: (id, cancel = false) => {
      const current = sessionRef.current;
      if (current?.active !== id) return;
      if (cancel) studio.update(binding, patched(current.source, Object.fromEntries(Object.entries(current.patches).filter(([key]) => Number(key) !== id))));
      changeSession(null);
      setEpoch((value) => value + 1);
    },
  };
  return <EditingContext.Provider value={context}>
    <PreviewMarkdown {...markdown} text={session?.rendered ?? rendered} rootComponent={EditableMarkdownRoot}
      textComponent={EditableMarkdownText} sourceValue={session?.source ?? source} sourceFields={fields} editEpoch={epoch} />
  </EditingContext.Provider>;
}
