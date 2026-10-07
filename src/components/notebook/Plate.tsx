import type { ReactNode } from "react";
import { Screen } from "@/components/rack/Screen";

type Props = {
  figure: string;
  caption?: ReactNode;
  children: ReactNode;
};

/** A figure: a printed label above a screen; the content is lit by the rice. */
export function Plate({ figure, caption, children }: Props) {
  return (
    <div className="plate">
      <span className="plate-figure-label">{figure}</span>
      <Screen label={figure}>
        <div className="plate-art">{children}</div>
      </Screen>
      {caption ? <span className="plate-caption">{caption}</span> : null}
    </div>
  );
}
