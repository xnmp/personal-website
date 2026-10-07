import Link from "next/link";
import type { ReactNode } from "react";

type Common = {
  tone?: "neutral" | "signal";
  size?: "md" | "lg";
  /** the shortcut legend printed before the label, e.g. "/"; it stays out of
   * the accessible name, which would otherwise run on ("escClose") */
  legend?: string;
  children: ReactNode;
  className?: string;
};

type Props = Common &
  (
    | { href: string; external?: boolean; newTab?: boolean; onClick?: never; ariaLabel?: string; disabled?: never }
    | { href?: never; external?: never; newTab?: never; onClick: () => void; ariaLabel?: string; disabled?: boolean }
  );

/**
 * A keycap. Semantics stay native (<a> or <button>); the cap art is three
 * authored states swapped in kit.css.
 */
export function Key({ tone = "neutral", size = "md", legend, children, className, ariaLabel, ...rest }: Props) {
  const cls = ["key", className].filter(Boolean).join(" ");
  const data = { "data-tone": tone === "signal" ? "signal" : undefined, "data-size": size === "lg" ? "lg" : undefined };
  const inner = (
    <>
      {legend ? <span className="key-legend" aria-hidden>
          {legend}
        </span> : null}
      <span>{children}</span>
    </>
  );
  if ("href" in rest && rest.href) {
    if (rest.external || /^(https?:|mailto:)/.test(rest.href)) {
      return (
        <a
          className={cls}
          href={rest.href}
          aria-label={ariaLabel}
          {...(rest.newTab ? { target: "_blank", rel: "noopener" } : {})}
          {...data}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link className={cls} href={rest.href} aria-label={ariaLabel} {...data}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={rest.onClick} disabled={rest.disabled} aria-label={ariaLabel} {...data}>
      {inner}
    </button>
  );
}

/** A non-interactive keycap legend, for printing shortcuts. */
export function Cap({ children, down }: { children: ReactNode; down?: boolean }) {
  return (
    <kbd className="key cap" data-down={down ? "true" : undefined}>
      <span>{children}</span>
    </kbd>
  );
}
