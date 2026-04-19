import type { ReactNode } from "react";

type Props = { brand: string; meta: ReactNode };

export function RunningHead({ brand, meta }: Props) {
  return (
    <header className="running-head">
      <div className="brand">{brand}</div>
      <div className="meta">{meta}</div>
    </header>
  );
}
