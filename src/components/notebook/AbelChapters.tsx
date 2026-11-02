import { readAbelNotes } from "@/lib/abel-notes.server";
import { bindField } from "@/lib/studio/bindings";
import { BoundText } from "@/components/studio/BoundText";
import Link from "next/link";

export function AbelChapters() {
  const { content, chapters } = readAbelNotes();
  return <ol className="math-chapters">
    {chapters.map((chapter, index) => <li key={chapter.id}>
      <Link href={`/p/abel-ruffini/notes/${chapter.id}`}>
        <BoundText text={chapter.title} binding={bindField(content, ["chapters", index, "title"])} />
      </Link>
      <p><BoundText text={chapter.summary} binding={bindField(content, ["chapters", index, "summary"])} /></p>
    </li>)}
  </ol>;
}
