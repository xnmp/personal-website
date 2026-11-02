import { Space_Grotesk, Instrument_Serif } from "next/font/google";

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
