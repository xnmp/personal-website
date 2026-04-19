import type { ReactNode } from "react";

type Props = {
  figure: string;
  caption?: ReactNode;
  children: ReactNode;
};

export function Plate({ figure, caption, children }: Props) {
  return (
    <figure className="plate">
      <span className="plate-figure-label">{figure}</span>
      <div className="plate-art">{children}</div>
      {caption ? <figcaption className="plate-caption">{caption}</figcaption> : null}
    </figure>
  );
}
