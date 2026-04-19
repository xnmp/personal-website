import type { ReactNode } from "react";

type Props = {
  label?: string;
  children: ReactNode;
};

export function MarginNote({ label, children }: Props) {
  return (
    <aside className="margin-note">
      {label ? <h4>{label}</h4> : null}
      {children}
    </aside>
  );
}
