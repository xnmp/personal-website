import type { ReactNode } from "react";
import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableRegion } from "./EditableRegion";

export function EditableText({ binding, children }: { binding?: ContentBinding; children: ReactNode }) {
  return binding ? <EditableRegion binding={binding} inline>{children}</EditableRegion> : children;
}
