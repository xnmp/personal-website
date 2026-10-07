import type { CSSProperties, ReactNode } from "react";
import type { Tone } from "@/data/projects";

type Props = {
  /** 1-bit alpha-mask art, recoloured by the active rice */
  art?: string;
  tone?: Tone;
  label?: string;
  className?: string;
  /** glare on the glass; on by default only over decorative art, never over content people read */
  glass?: boolean;
  children?: ReactNode;
};

/**
 * A recessed display: authored bezel (9-slice) over a face lit in the active
 * rice. Content inside is live DOM: charts, code, text, games.
 */
export function Screen({ art, tone, label, className, glass = Boolean(art), children }: Props) {
  return (
    <figure className={["screen", className].filter(Boolean).join(" ")} data-tone={tone} aria-label={label}>
      <div className={art ? "screen-face has-art" : "screen-face"}>
        {art ? (
          <span
            className="screen-art"
            aria-hidden
            style={{ "--art": `url(${art})` } as CSSProperties}
          />
        ) : null}
        {children}
        {glass ? <span className="screen-glass" aria-hidden /> : null}
      </div>
    </figure>
  );
}
