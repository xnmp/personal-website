import type { ReactNode } from "react";
import { Led } from "@/components/rack/Led";

type Props = {
  label?: string;
  children: ReactNode;
};

export function OpenQuestion({ label = "Open question", children }: Props) {
  return (
    <aside className="openq">
      <strong>
        <Led color="amber" on /> {label}
      </strong>{" "}
      {/* the label is set on its own line; the space keeps it a separate word when read aloud or copied */}
      {children}
    </aside>
  );
}
