import type { Metadata } from "next";
import { Cardo, Crimson_Pro, JetBrains_Mono } from "next/font/google";
import { CommandIndex } from "@/components/instrument/CommandIndex";
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
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "Chong — a notebook of small things",
  description:
    "A running record of the tools, games, and small studies I keep returning to.",
};

// Runs before paint so the stored theme applies without a flash.
const themeInit = `(function(){try{var t=localStorage.getItem("nb-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cardo.variable} ${crimson.variable} ${mono.variable}`}
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
