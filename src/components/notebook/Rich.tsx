import Link from "next/link";
import { parseInline } from "@/lib/inline";

/** A line of hand-edited copy with its inline markup (lib/inline.ts) rendered. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, i) => {
        switch (s.kind) {
          case "code":
            return <code key={i}>{s.text}</code>;
          case "strong":
            return <strong key={i}>{s.text}</strong>;
          case "em":
            return <em key={i}>{s.text}</em>;
          case "link":
            return s.href.startsWith("/") ? (
              <Link key={i} href={s.href}>
                {s.text}
              </Link>
            ) : (
              <a key={i} href={s.href}>
                {s.text}
              </a>
            );
          default:
            return s.text;
        }
      })}
    </>
  );
}
