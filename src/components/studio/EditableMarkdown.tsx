"use client";

import { useState } from "react";
import { MarkdownRenderer, type MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { SourceTextarea } from "./SourceTextarea";
import { useStudio } from "./StudioContext";

/** One authored content slot is one native field, regardless of Markdown structure. */
export function EditableMarkdown({ binding, markdown }: { binding: ContentBinding; markdown: MarkdownProps }) {
  const studio = useStudio()!;
  const [active, setActive] = useState(false);
  const source = studio.value(binding);
  if (studio.editing && studio.ready) {
    const Tag = markdown.inline ? "span" : "p";
    return <Tag className={markdown.inline ? "studio-region" : markdown.paragraphClassName}
      style={markdown.inline ? undefined : markdown.paragraphStyle}
      data-studio-slot={binding.slotId} data-studio-document={binding.documentId}
      data-studio-editable={!active || undefined} data-studio-active={active || undefined}>
      <SourceTextarea value={source} label={binding.label} inline={markdown.inline} readOnly={studio.locked}
        onActiveChange={setActive} onChange={value => studio.update(binding, value)} />
    </Tag>;
  }
  let rendered = source;
  try { rendered = interpolateContent(source, binding.fields ?? {}); } catch { /* Preview incomplete placeholders as authored. */ }
  return <MarkdownRenderer {...markdown} text={rendered} />;
}
