"use client";

import { useState, type ReactNode } from "react";
import type { MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import type { ContentBinding } from "@/lib/studio/bindings";
import { useStudio } from "./StudioContext";
import { EditableMarkdown } from "./EditableMarkdown";
import { SourceTextarea } from "./SourceTextarea";
import { TextContent, type TextFormat } from "./TextContent";

function EditableScalar({ binding, children, shortcuts, format }: { binding: ContentBinding; children: ReactNode; shortcuts: boolean; format: TextFormat }) {
  const studio = useStudio()!;
  const [active, setActive] = useState(false);
  const value = studio.value(binding);
  if (!studio.editing || !studio.ready) return value === binding.value ? children : <TextContent text={value} shortcuts={shortcuts} format={format} />;
  return <span className="studio-region" data-studio-slot={binding.slotId} data-studio-document={binding.documentId}
    data-studio-editable={!active || undefined} data-studio-active={active || undefined}>
    <SourceTextarea value={value} label={binding.label} inline readOnly={studio.locked}
      onActiveChange={setActive} onChange={value => studio.update(binding, value)} />
  </span>;
}

export function EditableRegion({ binding, markdown, children, shortcuts = false, format = "markdown" }: { binding: ContentBinding; markdown?: MarkdownProps; inline?: boolean; children: ReactNode; shortcuts?: boolean; format?: TextFormat }) {
  const studio = useStudio();
  if (!studio) return children;
  return markdown ? <EditableMarkdown binding={binding} markdown={markdown} /> : <EditableScalar binding={binding} shortcuts={shortcuts} format={format}>{children}</EditableScalar>;
}
