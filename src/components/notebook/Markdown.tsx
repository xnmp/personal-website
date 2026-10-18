import { MarkdownRenderer, type MarkdownProps } from "./MarkdownRenderer";
import { EditableRegion } from "@/components/studio/EditableRegion";
import type { ContentBinding } from "@/lib/studio/bindings";

export function Markdown({ binding, ...props }: MarkdownProps & { binding?: ContentBinding }) {
  if (binding) return <EditableRegion binding={binding} markdown={props}><MarkdownRenderer {...props} /></EditableRegion>;
  return props.inline ? <MarkdownRenderer {...props} /> : <div className="content-block"><MarkdownRenderer {...props} /></div>;
}
