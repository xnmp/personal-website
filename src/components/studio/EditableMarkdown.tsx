"use client";

import { memo } from "react";
import { MarkdownRenderer, type MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableField } from "./EditableField";
import { useStudio } from "./StudioContext";

const MarkdownPreview = memo(MarkdownRenderer);

/** One authored content slot is one native field, regardless of Markdown structure. */
export function EditableMarkdown({ binding, markdown }: { binding: ContentBinding; markdown: MarkdownProps }) {
  const studio = useStudio()!;
  const source = studio.value(binding);
  let rendered = source;
  try { rendered = interpolateContent(source, binding.fields ?? {}); } catch { /* Preview incomplete placeholders as authored. */ }
  return <EditableField binding={binding} source={source} inline={markdown.inline}
    paragraphClassName={markdown.paragraphClassName} paragraphStyle={markdown.paragraphStyle}>
    <MarkdownPreview {...markdown} text={rendered} />
  </EditableField>;
}
