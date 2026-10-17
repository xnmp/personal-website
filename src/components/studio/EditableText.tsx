import type { ReactNode } from "react";
import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableRegion } from "./EditableRegion";

export function EditableText({ binding, children, shortcuts = false }: { binding?: ContentBinding; children: ReactNode; shortcuts?: boolean }) {
  return binding ? <EditableRegion binding={binding} inline shortcuts={shortcuts}>{children}</EditableRegion> : children;
}
