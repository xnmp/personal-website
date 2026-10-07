"use client";

import { useState } from "react";
import { Key } from "@/components/rack/Key";

type Status = "idle" | "copied" | "failed";

const LEGEND: Record<Status, string> = { idle: "copy", copied: "copied", failed: "select it" };
const SPOKEN: Record<Status, string> = {
  idle: "",
  copied: "Copied to the clipboard.",
  failed: "Couldn't reach the clipboard. The text is selectable on the page.",
};

/**
 * Copies a command or an address; the legend confirms instead of a toast. A
 * tile by default; `variant="text"` prints it as a text action, the lower
 * tier for a utility beside a sheet's calls to action.
 */
export function CopyKey({
  text,
  size = "md",
  variant = "tile",
}: {
  text: string;
  size?: "md" | "lg";
  variant?: "tile" | "text";
}) {
  const [status, setStatus] = useState<Status>("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // clipboard denied or unavailable (insecure context, old browser)
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 1800);
  };
  return (
    <>
      {variant === "text" ? (
        <button type="button" className="text-action" onClick={copy} aria-label={`Copy: ${text}`}>
          {LEGEND[status]}
        </button>
      ) : (
        <Key onClick={copy} size={size} ariaLabel={`Copy: ${text}`}>
          {LEGEND[status]}
        </Key>
      )}
      <span className="sr-only" role="status">
        {SPOKEN[status]}
      </span>
    </>
  );
}
