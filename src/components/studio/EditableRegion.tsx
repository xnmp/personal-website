"use client";

import type { ReactNode } from "react";
import type { MarkdownProps } from "@/components/notebook/MarkdownRenderer";
import type { ContentBinding } from "@/lib/studio/bindings";
import { useStudio } from "./StudioContext";
import { EditableMarkdown } from "./EditableMarkdown";
import { EditableField } from "./EditableField";
import { TextContent, type TextFormat } from "./TextContent";

function EditableScalar({ binding, children, shortcuts, format }: { binding: ContentBinding; children: ReactNode; shortcuts: boolean; format: TextFormat }) {
  const studio = useStudio()!;
  const value = studio.value(binding);
  return <EditableField binding={binding} source={value} inline>
    {value === binding.value ? children : <TextContent text={value} shortcuts={shortcuts} format={format} />}
  </EditableField>;
}

export function EditableRegion({ binding, markdown, children, shortcuts = false, format = "markdown" }: { binding: ContentBinding; markdown?: MarkdownProps; inline?: boolean; children: ReactNode; shortcuts?: boolean; format?: TextFormat }) {
  const studio = useStudio();
  if (!studio) return markdown && !markdown.inline ? <div className="content-block">{children}</div> : children;
  return markdown ? <EditableMarkdown binding={binding} markdown={markdown} /> : <EditableScalar binding={binding} shortcuts={shortcuts} format={format}>{children}</EditableScalar>;
}
