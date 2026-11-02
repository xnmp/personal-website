"use client";

import { lazy, memo, Suspense } from "react";
import { MarkdownRenderer, type MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import { interpolateContent } from "@/lib/content-template";
import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableField } from "./EditableField";
import { useStudio } from "./StudioContext";

const MarkdownPreview = memo(MarkdownRenderer);
const MathMarkdownPreview = lazy(() => import("@/components/notebook/MathMarkdownRenderer"));

/** One authored content slot is one native field, regardless of Markdown structure. */
export function EditableMarkdown({ binding, markdown }: { binding: ContentBinding; markdown: MarkdownProps }) {
  const studio = useStudio()!;
  const source = studio.value(binding);
  let rendered = source;
  try { rendered = interpolateContent(source, binding.fields ?? {}); } catch { /* Preview incomplete placeholders as authored. */ }
  return <EditableField binding={binding} source={source} inline={markdown.inline}
    paragraphClassName={markdown.paragraphClassName} paragraphStyle={markdown.paragraphStyle}>
    {markdown.math ? <Suspense fallback={<p role="status">Typesetting…</p>}>
      <MathMarkdownPreview {...markdown} text={rendered} />
    </Suspense> : <MarkdownPreview {...markdown} text={rendered} />}
  </EditableField>;
}
