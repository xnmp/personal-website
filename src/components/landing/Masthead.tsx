import Link from "next/link";
import { Instruments } from "@/components/instrument/Instruments";
import { Led } from "@/components/rack/Led";

/**
 * The home page's masthead, part of its first screen: the brand set large
 * with its line under it, the site's name (the page's h1), and the keys at
 * the right printed as words over the scene. No strip: the scene is the
 * page's paper here (the other pages' masthead is RunningHead).
 */
export function Masthead({ brand, tagline }: { brand: string; tagline: string }) {
  return (
    <header className="masthead">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="masthead-brand">
        <h1 className="brand">
          <Led color="green" />
          <Link href="/">{brand}</Link>
        </h1>
        <p className="tagline">{tagline}</p>
      </div>
      <Instruments />
    </header>
  );
}
