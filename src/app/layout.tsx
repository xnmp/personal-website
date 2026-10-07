import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { CommandIndex } from "@/components/instrument/CommandIndex";
import "./globals.css";

// Archivo is the silkscreen printed on the faceplates: wide for labels and
// normal width for reading, so the `wdth` axis is included.
const print = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  // a real italic: the synthetic slant swallowed the space after <em>
  style: ["normal", "italic"],
  variable: "--font-print",
  display: "swap",
});

// JetBrains Mono is the terminal face from the dotfiles. It only appears inside screens.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "chong: tools, games, and the agents that play them",
  description:
    "A rack of things I build: a keyboard-first file manager in alpha, a markdown editor, a mood diary, a Hyprland status bar, and agents for Brood War, Magic and a family card game.",
};

// Runs before paint so the stored rice applies without a flash.
const themeInit = `(function(){try{var r=localStorage.getItem("nb-rice");var ok=["paper","horizon","cosmic-dusk","rapture"];if(ok.indexOf(r)===-1){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"cosmic-dusk":"paper"}document.documentElement.dataset.rice=r}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${print.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <CommandIndex />
      </body>
    </html>
  );
}
