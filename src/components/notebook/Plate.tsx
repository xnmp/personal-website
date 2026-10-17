import type { ContentBinding } from "@/lib/studio/bindings";
import type { ReactNode } from "react";
import { Screen } from "@/components/rack/Screen";
import { parseInline } from "@/lib/inline";
import { Markdown } from "./Markdown";

type Props = {
  figure: string;
  figureBinding?: ContentBinding;
  caption?: ReactNode;
  captionBinding?: ContentBinding;
  children: ReactNode;
};

/** A figure: a printed label above a screen; the content is lit by the rice. */
export function Plate({
  figure,
  figureBinding,
  caption,
  captionBinding,
  children,
}: Props) {
  return (
    <div className="plate">
      <span className="plate-figure-label">
        <Markdown text={figure} binding={figureBinding} inline />
      </span>
      <Screen
        label={parseInline(figure)
          .map((span) => span.text)
          .join("")}
      >
        <div className="plate-art">{children}</div>
      </Screen>
      {caption ? (
        <span className="plate-caption">
          {typeof caption === "string" ? (
            <Markdown text={caption} binding={captionBinding} inline />
          ) : (
            caption
          )}
        </span>
      ) : null}
    </div>
  );
}
