import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Newsreader } from "next/font/google";
import { CommandIndex } from "@/components/instrument/CommandIndex";
import "./globals.css";

// Three type roles (art/BRIEF.md). Newsreader sets the headlines on the paper.
// The optical-size axis lets display sizes tighten.
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
// and the labels typed on paper tape.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "chong: tools, games, and the agents that play them",
  description:
    "Things I build: a keyboard-first file manager in alpha, a markdown editor, a mood diary, a Hyprland status bar, and agents for Brood War, Magic and a family card game.",
};

// Runs before paint so the stored rice applies without a flash, and so the
// scene knows before its first frame whether the 3D diorama will draw it
// (components/rack/Scene.tsx): only with motion allowed, WebGL 2, and not on
// a low-memory or data-saving device. `nb-scene=flat` in localStorage opts out.
const themeInit = `(function(){var d=document.documentElement;try{var r=localStorage.getItem("nb-rice");var ok=["paper","horizon","cosmic-dusk","rapture"];if(ok.indexOf(r)===-1){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"cosmic-dusk":"paper"}d.dataset.rice=r}catch(e){}try{var n=navigator,m=n.deviceMemory,c=n.connection;if(window.matchMedia("(prefers-reduced-motion: no-preference)").matches&&window.WebGL2RenderingContext&&!(m&&m<4)&&!(c&&c.saveData)&&localStorage.getItem("nb-scene")!=="flat"){d.dataset.sceneMode="3d"}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${print.variable} ${mono.variable}`}
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
