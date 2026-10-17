import { MarkdownRenderer, type MarkdownProps } from "./MarkdownRenderer";
import { EditableRegion } from "@/components/studio/EditableRegion";
import type { ContentBinding } from "@/lib/studio/bindings";

export function Markdown({ binding, ...props }: MarkdownProps & { binding?: ContentBinding }) {
  return binding ? <EditableRegion binding={binding} markdown={props}><MarkdownRenderer {...props} /></EditableRegion> : <MarkdownRenderer {...props} />;
}
