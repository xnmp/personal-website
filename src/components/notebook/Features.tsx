import type { ReactNode } from "react";

export function Features({ children }: { children: ReactNode }) {
  return <div className="features">{children}</div>;
}

type FeatureProps = { label: string; children: ReactNode };

export function Feature({ label, children }: FeatureProps) {
  return (
    <div className="feat">
      <h5>{label}</h5>
      <p>{children}</p>
    </div>
  );
}
