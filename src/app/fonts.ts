import { LXGW_WenKai_TC, Archivo, Comic_Neue, Cormorant, EB_Garamond, Fraunces, Grandstander, IM_Fell_English, Inter, JetBrains_Mono, Newsreader, Crimson_Pro, Caveat, Protest_Revolution, Special_Elite } from "next/font/google";

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

// Natural Garden: a classical book face, the type of the old gardening books.
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
  preload: false,
});

// Ligne Claire: a comic letterer's hand set in type, upright and italic,
// for what the album letters in words (the tagline, the nav, the pitch, the
// buttons, the panels' titles and headings) and for its prose.
const comicNeue = Comic_Neue({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-comic-neue",
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

// Ligne Claire: a comic letterer's heavy italic, for the headline lettered
// across the hero's sky.
const grandstander = Grandstander({
  subsets: ["latin"],
  weight: "variable",
  style: ["italic"],
  variable: "--font-grandstander",
  display: "swap",
  preload: false,
});

// Ligne Claire: a neutral UI sans for the app window drawn on the hero (the
// window is an application in the scene, not lettering, as the original
// mock draws it).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

// Cyanotype: a typewriter face with slab serifs, as a darkroom types its
// labels: the tagline, the keys, the buttons and the cards' titles. The
// original mock's is a slab typewriter with a tall x-height, set at about 20px
// at normal tracking; of the typewriter faces measured against it (cap
// height, x-height and set width of its strings), Special Elite lands within
// 5% on all three where Courier Prime's x-height ran 20% short.
const typewriter = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
  preload: false,
});

// Paper Diorama: a sturdy old-style book face, heavy enough in its bold to
// hold a headline cut from cream paper, as the original mock sets them.
const crimson = Crimson_Pro({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-crimson",
  display: "swap",
  preload: false,
});

// Natural Garden: a slanted, thin-stroked pen script, the hand the garden's
// labels are lettered in (the "Projects" stone, as the original mock letters
// it: tall and narrow, where Merienda was upright and broad).
const caveat = Caveat({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

// Sumi-e Ink: an upright dry brush, its strokes streaked along their line,
// for the names a page writes in ink that are not the home page's fixed
// three (those are the original mock's own lettering, sumi.css).
const protest = Protest_Revolution({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-protest",
  display: "swap",
  preload: false,
});

// Sumi-e Ink: a regular-script (kaishu) hand for the characters stamped in
// the cards' seals, the seals' own style, one per project (`--glyph`, which
// any project may carry, so the face must draw them all: traditional forms
// included, which a Japanese face lacks). Hanzi are not a font a visitor has
// by luck: a system fallback would draw them differently on each OS, so the
// seal reads this face alone, and `display: block` keeps a seal blank
// rather than stamped in a stranger's hand until it arrives. The face is
// split by Google into small unicode-range slices, so a visitor fetches only
// the ones for the characters on their page; nothing is preloaded.
const seal = LXGW_WenKai_TC({
  weight: "700",
  variable: "--font-seal",
  display: "block",
  preload: false,
});

// Paper Diorama: the headline of a project's page, set in Newsreader as the
// original mock sets it (a tight, heavy transitional serif that fills its
// card). The site's display face is Newsreader too, but the paper's own
// (Crimson Pro) overrides --font-display for the whole style, so its
// headlines name the face by a variable of their own.
const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});

export const fontVariables = [display, print, mono, fraunces, cormorant, garamond, comicNeue, fell, grandstander, inter, typewriter, crimson, caveat, protest, seal, newsreader].map((f) => f.variable).join(" ");
