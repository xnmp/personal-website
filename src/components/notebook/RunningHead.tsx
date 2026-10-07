import type { ReactNode } from "react";
import Link from "next/link";
import { Instruments } from "@/components/instrument/Instruments";
import { Led } from "@/components/rack/Led";

type Props = {
  brand: string;
  meta: ReactNode;
  /** detail-page links (back to the rack, source, a sub-page); printed on the masthead */
  nav?: ReactNode;
};

/** The masthead: the top plate of the rack, with the power LED and controls. */
export function RunningHead({ brand, meta, nav }: Props) {
  return (
    <header className="running-head faceplate">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="brand">
        <Led color="green" />
        <Link href="/">{brand}</Link>
      </div>
      <div className="meta silk">{meta}</div>
      <Instruments />
      {nav ? <nav className="head-nav silk">{nav}</nav> : null}
    </header>
  );
}
