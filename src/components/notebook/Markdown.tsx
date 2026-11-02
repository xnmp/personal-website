import { MarkdownRenderer, type MarkdownProps } from "./MarkdownRenderer";
import { EditableRegion } from "@/components/studio/EditableRegion";
import type { ContentBinding } from "@/lib/studio/bindings";
import MathMarkdownRenderer from "./MathMarkdownRenderer";

export function Markdown({ binding, ...props }: MarkdownProps & { binding?: ContentBinding }) {
  const content = props.math ? <MathMarkdownRenderer {...props} /> : <MarkdownRenderer {...props} />;
  if (binding) return <EditableRegion binding={binding} markdown={props}>{content}</EditableRegion>;
  return props.inline ? content : <div className="content-block">{content}</div>;
}
