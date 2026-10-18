import { ForOS } from "@/components/launch/ForOS";
import { MarkdownRenderer } from "@/components/notebook/MarkdownRenderer";
import { ShortcutMarkdown } from "@/components/notebook/ShortcutMarkdown";

export type TextFormat = "markdown" | "plain";

/** Labels are phrasing content and may already sit inside a link. Code stays literal. */
export function TextContent({ text, shortcuts = false, format = "markdown" }: { text: string; shortcuts?: boolean; format?: TextFormat }) {
  if (format === "plain") return shortcuts ? <ForOS>{text}</ForOS> : text;
  return shortcuts ? <ShortcutMarkdown text={text} /> : <MarkdownRenderer text={text} inline allowLinks={false} />;
}
