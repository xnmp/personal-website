import { ledFor, type Status } from "@/data/projects";

type Props = { className?: string } & (
  | { status: Status; color?: never; on?: never; blink?: never }
  | { status?: never; color: "green" | "amber" | "signal"; on?: boolean; blink?: boolean }
);

/**
 * A status pin: its colour is the status (art/BRIEF.md). Inline, it marks a
 * line of text; with `className="sheet-pin"` it is the pin that holds a sheet
 * up, at the top of its paper. Decorative: the status is always also printed
 * as text.
 */
export function Led(props: Props) {
  const s = props.status ? ledFor(props.status) : { color: props.color, on: props.on ?? true, blink: props.blink ?? false };
  const cls = props.className ? `led ${props.className}` : "led";
  return <span className={cls} data-color={s.color} data-on={s.on} data-blink={s.blink} aria-hidden />;
}
