import { EditableText } from "@/components/studio/EditableText";
import { bindField } from "@/lib/studio/bindings";
import { readContent } from "@/lib/content.server";
import type { ReactNode } from "react";
import Link from "next/link";
import { Instruments } from "@/components/instrument/Instruments";
import { Led } from "@/components/rack/Led";
import { readSiteBrand } from "@/data/site";
import { MarginDetails } from "./MarginDetails";

type Props = {
  brand?: string;
  meta: ReactNode;
  /** detail-page links (back to the rack, source, a sub-page); printed on the masthead */
  nav?: ReactNode;
};

/** The masthead: the top plate of the rack, with the power LED and controls. */
export function RunningHead({ brand, meta, nav }: Props) {
  const title = brand ?? readSiteBrand();
  const binding =
    brand === undefined ? bindField(readContent("home"), ["brand"]) : undefined;
  return (
    <header className="running-head faceplate">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="brand">
        <Led color="green" />
        <Link href="/">
          <EditableText binding={binding}>{title}</EditableText>
        </Link>
      </div>
      <div className="meta silk">{meta}</div>
      <Instruments />
      <MarginDetails />
      {nav ? (
        <nav className="head-nav" aria-label="Pages">
          {nav}
        </nav>
      ) : null}
    </header>
  );
}
