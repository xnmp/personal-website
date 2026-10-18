import type { ReactNode } from "react";
import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableRegion } from "./EditableRegion";
import { TextContent, type TextFormat } from "./TextContent";

export function EditableText({ binding, children, shortcuts = false, format = "markdown" }: { binding?: ContentBinding; children: ReactNode; shortcuts?: boolean; format?: TextFormat }) {
  const content = typeof children === "string" ? <TextContent text={children} shortcuts={shortcuts} format={format} /> : children;
  return binding ? <EditableRegion binding={binding} inline shortcuts={shortcuts} format={format}>{content}</EditableRegion> : content;
}
