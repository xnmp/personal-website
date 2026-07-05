import { JetBrains_Mono, Space_Grotesk, Instrument_Serif } from "next/font/google";

/** UI, labels, code — the app is keyboard-first and mono-typed. */
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--tf-mono",
  display: "swap",
});

/** Display face with genuine personality — not a default sans. */
export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--tf-display",
  display: "swap",
});

/** Serif italic accents for pull-quotes / first-principles asides. */
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--tf-serif",
  display: "swap",
});
