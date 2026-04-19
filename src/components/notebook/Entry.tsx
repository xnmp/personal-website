import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export function Entry({ left, right }: Props) {
  return (
    <section className="entry">
      <div>{left}</div>
      <div>{right}</div>
    </section>
  );
}
