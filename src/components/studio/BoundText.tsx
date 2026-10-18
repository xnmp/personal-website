"use client";

import type { ContentBinding } from "@/lib/studio/bindings";
import { useStudio } from "./StudioContext";
import { TextContent } from "./TextContent";

/** A derived label follows the same source and drafts without becoming another editor. */
export function BoundText({ binding, text }: { binding?: ContentBinding; text: string }) {
  const studio = useStudio();
  return <TextContent text={studio && binding ? studio.value(binding) : text} />;
}
