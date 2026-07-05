import Link from "next/link";
import { RunningHead, PageBackground, Folio } from "@/components/notebook";

export default function NotFound() {
  return (
    <>
      <PageBackground src="/bg/watercolor-1.jpg" />
      <RunningHead
        brand="chong"
        meta={<>filed under <span className="filed">nothing</span></>}
      />
      <main className="blank-leaf">
        <div className="kicker">№ 404 — a blank leaf</div>
        <h1>This page was never written.</h1>
        <p>
          Either the entry moved, or it only ever existed as an open question.
          The index (<code>/</code>) knows everything that&rsquo;s actually here.
        </p>
        <Link href="/" className="read-more">
          return to the notebook →
        </Link>
      </main>
      <Folio number="∅" />
    </>
  );
}
