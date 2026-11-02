import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "./math.css";

export default function MathLayout({ children }: { children: ReactNode }) {
  return children;
}
