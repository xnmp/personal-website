import type { CSSProperties, ReactNode } from "react";
import type { Tone } from "@/data/projects";

type Props = {
  /** 1-bit alpha-mask art, recoloured by the active rice */
  art?: string;
  tone?: Tone;
  label?: string;
  className?: string;
  /** glare on the glass (faint over content people read; see kit.css) */
  glass?: boolean;
  children?: ReactNode;
};

/**
 * A recessed display: authored bezel (9-slice) over a face lit in the active
 * rice. Content inside is live DOM: charts, code, text, games.
 */
export function Screen({ art, tone, label, className, glass = true, children }: Props) {
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
        {/* the panel's edge and its recess in the mat, above whatever the
            screen shows (an image would cover a shadow on the face itself) */}
        <span className="screen-edge" aria-hidden />
      </div>
    </figure>
  );
}
