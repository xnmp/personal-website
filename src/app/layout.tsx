import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CommandIndex } from "@/components/instrument/CommandIndex";
import "./globals.css";

// Both fonts come from the dotfiles: Inter is the wezterm window-frame font,
// JetBrains Mono is the terminal face. Same provenance as the colors.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "chong — tools, games, small studies",
  description:
    "A session over the things I keep building: a file manager, a query compiler, card-game AIs, and the harnesses that build them.",
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
      className={`${inter.variable} ${mono.variable}`}
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
