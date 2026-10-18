"use client";

import { useOS } from "@/components/launch/useOS";
import { MarkdownRenderer } from "./MarkdownRenderer";

/** Format prose after adapting canonical shortcut names to the visitor's keyboard. */
export function ShortcutMarkdown({ text }: { text: string }) {
  return <MarkdownRenderer text={text} shortcutOS={useOS()} inline allowLinks={false} />;
}
