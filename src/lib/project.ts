/** Which LED a module shows. Mirrors what is actually true of the project. */
export type Status = "alpha" | "producing" | "paused" | "complete";

/** Rice token used to light the module's screen art. */
export type Tone = "cyan" | "rust" | "amber" | "olive";

export type Shelf = "tools" | "games";

/** A project as it is written down. Its number is its place in the list
 *  (see `projects`), so adding or removing one never means renumbering. */
export interface ProjectEntry {
  slug: string;
  /** one character that names the project, for a style that stamps it (a
   *  seal). Content, not a style's: every style may use it or not. */
  glyph: string;
  title: string;
  heading: string; // the one-liner
  /** Concise directory copy; older entries fall back to the heading. */
  summary?: string;
  /** Optional real product capture. {theme} follows the visitor's app theme. */
  preview?: { src: string; alt: string; width: number; height: number };
  href: string; // detail page
  /** public source only; private repos are deliberately left unlinked */
  repo?: string;
  tags: string[];
  /** one-line description used by the command index */
  index: string;
  status: Status;
  shelf: Shelf;
  /** 1-bit screen art (alpha mask in public/screens) */
  art: string;
  tone: Tone;
  /** short real numbers for the module's readout */
  stats: string[];
}

export interface Project extends ProjectEntry {
  /** "01": the project's place in the list, silkscreened on its module */
  number: string;
}

/** The LED each status lights. Pure, so the mapping is testable. */
export function ledFor(status: Status): { color: "green" | "amber" | "signal"; on: boolean; blink: boolean } {
  switch (status) {
    case "alpha":
      return { color: "signal", on: true, blink: true };
    case "producing":
      return { color: "green", on: true, blink: false };
    case "paused":
      return { color: "amber", on: true, blink: false };
    case "complete":
      return { color: "green", on: false, blink: false };
  }
}

export const statusLabel: Record<Status, string> = {
  alpha: "alpha open",
  producing: "active",
  paused: "paused",
  complete: "complete",
};
