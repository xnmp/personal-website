import type { Metadata } from "next";
import { Cardo, Crimson_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cardo = Cardo({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cardo",
  display: "swap",
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "Chong — a notebook of small things",
  description:
    "A running record of the tools, games, and small studies I keep returning to.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cardo.variable} ${crimson.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
