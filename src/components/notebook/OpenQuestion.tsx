import type { ReactNode } from "react";

type Props = {
  label?: string;
  children: ReactNode;
};

export function OpenQuestion({ label = "Open question", children }: Props) {
  return (
    <aside className="openq">
      <strong>{label}</strong>
      {children}
    </aside>
  );
}
