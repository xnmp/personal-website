import type { ContentBinding } from "@/lib/studio/bindings";
import type { ReactNode } from "react";
import { Markdown } from "./Markdown";

export function Features({ children }: { children: ReactNode }) {
  return <div className="features">{children}</div>;
}

type FeatureProps = {
  label: string;
  labelBinding?: ContentBinding;
  children: ReactNode;
};

export function Feature({ label, labelBinding, children }: FeatureProps) {
  return (
    <div className="feat">
      <h3>
        <Markdown text={label} binding={labelBinding} inline />
      </h3>
      <p>{children}</p>
    </div>
  );
}
