"use client";

import Link from "next/link";
import type { HTMLAttributes, HTMLAttributeAnchorTarget } from "react";
import { useStudio } from "./StudioContext";

type Props = HTMLAttributes<HTMLElement> & { href: string; target?: HTMLAttributeAnchorTarget; rel?: string; editable?: boolean; block?: boolean };

/** Editable labels need a noninteractive parent while their controls are available. */
export function EditableLink({ editable = true, block = false, href, target, rel, children, ...props }: Props) {
  const studio = useStudio();
  if (editable && studio?.editing && studio.ready) {
    const Tag = block ? "div" : "span";
    return <Tag {...props} data-rack-stop={undefined} data-studio-link>{children}</Tag>;
  }
  return <Link {...props} href={href} target={target} rel={rel}>{children}</Link>;
}
