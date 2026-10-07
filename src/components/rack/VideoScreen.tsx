import type { CSSProperties } from "react";
import { Key } from "./Key";

/**
 * A YouTube video as a poster with a key that opens it on YouTube. The screen
 * shows authored 1-bit art of the video in the rice's tone; nothing loads from
 * YouTube until the visitor leaves for it, and the page keeps its focus and
 * scroll position.
 */
export function VideoScreen({ id, title, art, label = "Watch on YouTube" }: { id: string; title: string; art: string; label?: string }) {
  return (
    <div className="video-screen">
      <span className="screen-art" aria-hidden style={{ "--art": `url(${art})` } as CSSProperties} />
      <Key tone="signal" size="lg" href={`https://www.youtube.com/watch?v=${id}`} newTab ariaLabel={`${label}: ${title} (opens YouTube in a new tab)`}>
        ▶&nbsp; {label} ↗
      </Key>
      <span className="screen-glass" aria-hidden />
    </div>
  );
}
