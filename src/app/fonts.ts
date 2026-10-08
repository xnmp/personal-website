import { Archivo, Barlow_Semi_Condensed, Bodoni_Moda, Cormorant, EB_Garamond, Fraunces, IM_Fell_English, JetBrains_Mono, Newsreader } from "next/font/google";

// Three type roles (art/BRIEF.md): --font-display (headlines), --font-print
// (body and UI) and --font-mono (labels, key legends, everything on a
// screen). The Paper Diorama's faces fill them by default; a style may
// re-point a role at its own face (src/app/styles/<style>.css). Those faces
// are declared here with `preload: false`, so a visitor only downloads the
// faces of the style they are looking at.

// Newsreader sets the headlines on the paper. The optical-size axis lets
// display sizes tighten.
const display = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Archivo is the body and UI face on the paper.
const print = Archivo({
  subsets: ["latin"],
  // a real italic: the synthetic slant swallowed the space after <em>
  style: ["normal", "italic"],
  variable: "--font-print",
  display: "swap",
});

// JetBrains Mono is the terminal face from the dotfiles: screens, key legends
// and the labels typed on paper tape. Every style keeps it.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Solarpunk: a soft, warm old-style serif with a little wobble, like a seed
// catalogue's headings.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

// Sumi-e Ink: a high-contrast old-style serif whose italic moves like a
// brush, set heavy enough to hold a headline.
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

// Cyanotype: a Didone, the type of the cyanotype's own century, set at the
// optical size of its text cuts (cyanotype.css), whose sturdier hairlines
// hold over the brushed blue.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
});

// Natural Garden: a classical book face, the type of the old gardening books.
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
  preload: false,
});

// Ligne Claire: a clean, slightly condensed sans, the comic album's lettering
// set in type.
const barlow = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
  preload: false,
});

// Celestial Atlas: the Fell types, cut in the century of the great engraved
// star atlases.
const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell",
  display: "swap",
  preload: false,
});

export const fontVariables = [display, print, mono, fraunces, cormorant, bodoni, garamond, barlow, fell].map((f) => f.variable).join(" ");
