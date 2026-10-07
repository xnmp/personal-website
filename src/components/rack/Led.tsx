import { ledFor, type Status } from "@/data/projects";

type Props =
  | { status: Status; color?: never; on?: never; blink?: never }
  | { status?: never; color: "green" | "amber" | "signal"; on?: boolean; blink?: boolean };

/** A panel indicator. Decorative: the status is always also printed as text. */
export function Led(props: Props) {
  const s = props.status ? ledFor(props.status) : { color: props.color, on: props.on ?? true, blink: props.blink ?? false };
  return <span className="led" data-color={s.color} data-on={s.on} data-blink={s.blink} aria-hidden />;
}
