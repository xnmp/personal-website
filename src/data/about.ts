/**
 * The about page (/about). Edit this file to change it; nothing else needs
 * touching.
 *
 * - Every string takes a little inline markup (lib/inline.ts): `code`,
 *   **bold**, *italic* and [a link](https://example.com).
 * - Paragraphs are separate strings in a `body` array.
 * - Anything marked `draft: true` is a placeholder still to be written. It
 *   shows under `bun run dev`, labelled "draft", and is left out of the
 *   production build, so an unfinished part never ships. Delete the flag once
 *   it's written.
 * - `portrait` is optional: put a photo in `public/` and point `src` at it,
 *   and the hero mounts it in a window mat beside the intro.
 */

export interface AboutSection {
  /** the tape label above the heading */
  kicker: string;
  heading: string;
  /** a short note under the heading, in the sheet's left column */
  aside?: string;
  body: string[];
  draft?: boolean;
}

export interface AboutFact {
  label: string;
  value: string;
  draft?: boolean;
}

export interface About {
  kicker: string;
  headline: string;
  intro: string[];
  portrait?: { src: string; alt: string };
  sections: AboutSection[];
  /** printed on the spec strip at the foot of the page */
  facts: AboutFact[];
}

export const about: About = {
  kicker: "About · Sydney",
  headline: "Hi, I’m Chong. I build the software I want to use, then measure it.",
  intro: [
    "Most of what’s on this site started as an itch: a file manager that worked the way my editor does, a markdown reader that opened instantly, a status bar that could tell me what my coding agents were doing.",
    "The other half is the games I grew up on: Brood War, Magic and our family card game. I keep coming back to them as machine-learning problems.",
  ],
  sections: [
    {
      kicker: "How I work",
      heading: "Numbers, and the parts that didn’t work",
      aside: "Every project page says what was measured, how, and what went wrong.",
      body: [
        "I’d rather publish an honest 6% than a flattering 76%. When the [Brood War agent](/p/bwai)’s win rate turned out to be measured against a broken opponent, the page says so, and gives the real number.",
        "The same habit runs through the tools: [Scrivo](/p/scrivo) is benchmarked against Typora in paired runs, and [LambdaQuery](/p/lambdaquery) is checked against DuckDB by an adversarial oracle that caught two real compiler bugs.",
      ],
    },
    {
      kicker: "Setup",
      heading: "One set of dotfiles, four operating systems",
      body: [
        "I live in a tiling window manager and a terminal. The same [dotfiles](https://github.com/xnmp/dotfiles) run on NixOS, Arch, macOS and WSL, and their colour schemes (*rices*) light every screen on this site. Press `t` to cycle them.",
      ],
    },
    {
      kicker: "Background",
      heading: "How I got here",
      aside: "Placeholder: where you studied, what you do for work, how you started programming.",
      body: [
        "Write a paragraph or two about your background here.",
      ],
      draft: true,
    },
    {
      kicker: "Away from the keyboard",
      heading: "Outside the screen",
      aside: "Placeholder: what you do when you’re not building things.",
      body: [
        "Write about life outside programming here.",
      ],
      draft: true,
    },
  ],
  facts: [
    { label: "Based in", value: "Sydney" },
    { label: "Works in", value: "Rust, TypeScript, Python" },
    { label: "Runs on", value: "NixOS, Arch, Hyprland" },
    { label: "Source", value: "[github/xnmp](https://github.com/xnmp)" },
    { label: "Write to", value: "[chonw@proton.me](mailto:chonw@proton.me)" },
  ],
};

/** Drafts are written in dev and left out of production. Pure, for tests. */
export function publishable<T extends { draft?: boolean }>(items: readonly T[], includeDrafts: boolean): T[] {
  return items.filter((i) => includeDrafts || !i.draft);
}
