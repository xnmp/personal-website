import { notFound } from "next/navigation";
import { readAbelNotes } from "@/lib/abel-notes.server";
import { bindBlock, bindField } from "@/lib/studio/bindings";
import { Folio, ProjectMeta, RunningHead } from "@/components/notebook";
import { EditableText } from "@/components/studio/EditableText";
import { Markdown } from "@/components/notebook/Markdown";
import { AbelChapters } from "@/components/notebook/AbelChapters";
import { Key } from "@/components/rack";
import Link from "next/link";

type Props = { params: Promise<{ note: string }> };

function chapterFor(id: string) {
  const { content, chapters } = readAbelNotes();
  const index = chapters.findIndex(chapter => chapter.id === id);
  if (index === -1) notFound();
  return { content, chapters, index, chapter: chapters[index] };
}

export function generateStaticParams() {
  return readAbelNotes().chapters.map(chapter => ({ note: chapter.id }));
}

export async function generateMetadata({ params }: Props) {
  const { chapter } = chapterFor((await params).note);
  return { title: `${chapter.title} · Abel–Ruffini · chong`, description: chapter.summary };
}

export default async function AbelNote({ params }: Props) {
  const { content, chapters, chapter, index } = chapterFor((await params).note);
  return <>
    <RunningHead meta={<ProjectMeta slug="abel-ruffini" />} nav={<Key href="/p/abel-ruffini">← Abel–Ruffini</Key>} />
    <main id="content" className="rack-main math-prose math-reading" tabIndex={-1}>
      <section className="detail-hero solo">
        <div>
          <div className="kicker">{index + 1} / {chapters.length} · worked notes</div>
          <h1><EditableText binding={bindField(content, ["chapters", index, "title"])}>{chapter.title}</EditableText></h1>
          <p><EditableText binding={bindField(content, ["chapters", index, "summary"])}>{chapter.summary}</EditableText></p>
        </div>
      </section>
      <article className="faceplate"><Markdown {...bindBlock(content, chapter.id)} math /></article>
      <nav className="math-note-nav" aria-label="Chapter navigation">
        {index > 0 && <Link href={`/p/abel-ruffini/notes/${chapters[index - 1].id}`}>← {chapters[index - 1].title}</Link>}
        {index < chapters.length - 1 && <Link href={`/p/abel-ruffini/notes/${chapters[index + 1].id}`}>{chapters[index + 1].title} →</Link>}
      </nav>
      <nav aria-label="All Abel–Ruffini chapters"><AbelChapters /></nav>
    </main>
    <Folio slug="abel-ruffini" />
  </>;
}
