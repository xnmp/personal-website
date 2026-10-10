import type { Metadata } from "next";
import { CommandIndex } from "@/components/instrument/CommandIndex";
import { DEFAULT_STYLE, SCENE_ART, STYLE_IDS, STYLE_KEY } from "@/lib/styles";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chong.md"),
  title: "chong: tools, games, and the agents that play them",
  description:
    "Things I build: a keyboard-first file manager in alpha, a markdown editor, a mood diary, a Hyprland status bar, and agents for Brood War, Magic and a family card game.",
};

// Runs before paint so the stored style (lib/styles.ts) and rice apply
// without a flash, so the home page's stage knows how much room the
// scrollbar takes (globals.css --stage-w: none where it overlays the page),
// and so the scene knows before its first frame whether the 3D diorama will draw it
// (components/rack/Scene.tsx): only with motion allowed, WebGL 2, and not on
// a low-memory or data-saving device. `nb-scene=flat` in localStorage opts out.
const themeInit = `(function(){var d=document.documentElement;try{var p=document.createElement("div");p.style.cssText="position:absolute;visibility:hidden;width:99px;height:99px;overflow:scroll";d.appendChild(p);d.style.setProperty("--scrollbar",p.offsetWidth-p.clientWidth+"px");d.removeChild(p)}catch(e){}d.dataset.style=${JSON.stringify(DEFAULT_STYLE)};try{var s=localStorage.getItem(${JSON.stringify(STYLE_KEY)});if(${JSON.stringify(STYLE_IDS)}.indexOf(s)!==-1)d.dataset.style=s}catch(e){}d.dataset.sceneArt=${JSON.stringify(SCENE_ART)}[d.dataset.style];try{var r=localStorage.getItem("nb-rice");var ok=["paper","horizon","cosmic-dusk","rapture"];if(ok.indexOf(r)===-1){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"cosmic-dusk":"paper"}d.dataset.rice=r}catch(e){}try{var n=navigator,m=n.deviceMemory,c=n.connection;if(window.matchMedia("(prefers-reduced-motion: no-preference)").matches&&window.WebGL2RenderingContext&&!(m&&m<4)&&!(c&&c.saveData)&&localStorage.getItem("nb-scene")!=="flat"&&d.dataset.sceneArt==="diorama"){d.dataset.sceneMode="3d"}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={fontVariables}
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
