import type { ContentBinding } from "@/lib/studio/bindings";
import { EditableText } from "@/components/studio/EditableText";
import Link from "next/link";
import { Instruments } from "@/components/instrument/Instruments";
import { Led } from "@/components/rack/Led";
import { MarginDetails } from "@/components/notebook/MarginDetails";

/**
 * The home page's masthead, part of its first screen: the brand set large
 * with its line under it, the site's name (the page's h1), and the keys at
 * the right printed as words over the scene. No strip: the scene is the
 * page's paper here (the other pages' masthead is RunningHead).
 */
export function Masthead({
  brand,
  brandBinding,
  tagline,
  taglineBinding,
}: {
  brand: string;
  brandBinding?: ContentBinding;
  tagline: string;
  taglineBinding?: ContentBinding;
}) {
  return (
    <header className="masthead">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="masthead-brand">
        <h1 className="brand">
          <Led color="green" />
          <Link href="/">
            <EditableText binding={brandBinding}>{brand}</EditableText>
          </Link>
        </h1>
        <p className="tagline">
          <EditableText binding={taglineBinding}>{tagline}</EditableText>
        </p>
      </div>
      <Instruments />
      <MarginDetails />
    </header>
  );
}
