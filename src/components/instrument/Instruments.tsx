"use client";

import { usePathname } from "next/navigation";
import { Key } from "@/components/rack/Key";
import { openIndex } from "./CommandIndex";
import { StyleMenu } from "./StyleMenu";
import { ThemeMenu } from "./ThemeMenu";

/** Navigation, search, colour-theme menu, and independent art-direction menu. */
export function Instruments() {
  const path = usePathname();
  return (
    <span className="instruments">
      <Key href="/projects" className="margin-projects" current={path === "/projects"}>projects</Key>
      <Key href="/" className="about-key" current={path === "/" || path === "/about"} ariaLabel="About me">
        <span className="about-word">about</span>
        {/* on the narrowest phones, a head and shoulders: the row has no room for the word */}
        <svg className="about-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <circle cx="10" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 17.25a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Key>
      <Key legend="/" className="index-key" onClick={openIndex} ariaLabel="Open the index of projects">
        <span className="index-word">index</span>
        {/* on the narrowest phones, a lens: the row has no room for the word */}
        <svg className="index-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden>
          <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.5 12.5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Key>
      <ThemeMenu />
      <StyleMenu />
      <span className="sr-only" role="status" data-theme-status />
    </span>
  );
}
