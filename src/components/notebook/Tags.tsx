import type { ReactNode } from "react";

export function Tags({ children }: { children: ReactNode }) {
  return <div className="tags">{children}</div>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}
