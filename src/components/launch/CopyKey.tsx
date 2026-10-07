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

/** A keycap that copies a command; the legend confirms instead of a toast. */
export function CopyKey({ text, size = "md" }: { text: string; size?: "md" | "lg" }) {
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
      <Key onClick={copy} size={size} ariaLabel={`Copy: ${text}`}>
        {LEGEND[status]}
      </Key>
      <span className="sr-only" role="status">
        {SPOKEN[status]}
      </span>
    </>
  );
}
