import type { ContentBinding } from "@/lib/studio/bindings";
import type { ReactNode } from "react";
import { Led } from "@/components/rack/Led";
import { Markdown } from "./Markdown";

type Props = {
  label?: string;
  labelBinding?: ContentBinding;
  children: ReactNode;
};

export function OpenQuestion({
  label = "Open question",
  labelBinding,
  children,
}: Props) {
  return (
    <aside className="openq">
      <strong>
        <Led color="amber" on />{" "}
        <Markdown text={label} binding={labelBinding} inline />
      </strong>{" "}
      {/* the label is set on its own line; the space keeps it a separate word when read aloud or copied */}
      {children}
    </aside>
  );
}
