import type { ReactNode } from "react";
import Link from "next/link";
import { Instruments } from "@/components/instrument/Instruments";

type Props = { brand: string; meta: ReactNode };

export function RunningHead({ brand, meta }: Props) {
  return (
    <header className="running-head">
      <div className="brand">
        <Link href="/">{brand}</Link>
      </div>
      <div className="head-right">
        <div className="meta">{meta}</div>
        <Instruments />
      </div>
    </header>
  );
}
