import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cap, Led, Screen } from "@/components/rack";
import { bySlug } from "@/data/projects";

/**
 * Social cards, drawn with the real kit and captured to PNG by
 * scripts/render-og.mjs. They're kept as routes so the cards can't drift from
 * the site's art. They are not linked anywhere and are noindexed.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return [{ card: "home" }, { card: "tauri-explorer" }];
}

const art = (slug: string) => bySlug.get(slug)!;

function HomeCard() {
  const tiles = ["tauri-explorer", "bwai", "ashen-cathedral", "scrivo"].map(art);
  return (
    <div className="og-plate faceplate og-home">
      <div className="og-copy">
        <span className="brand">
          <Led color="green" /> chong
        </span>
        <h1 className="og-title">
          Tools I use every day, <span className="soft">and agents for the games I grew up on.</span>
        </h1>
        <span className="silk">11 projects &nbsp;·&nbsp; chong.md</span>
      </div>
      <div className="og-tiles">
        {tiles.map((p) => (
          <Screen key={p.slug} art={p.art} tone={p.tone} />
        ))}
      </div>
    </div>
  );
}

function TauriCard() {
  return (
    <div className="og-plate faceplate og-tauri">
      <div className="og-copy">
        <span className="silk og-kicker">
          <Led color="signal" /> Tauri Explorer &nbsp;·&nbsp; alpha testers wanted
        </span>
        <h1 className="og-title">
          Ctrl<span className="chord-plus">+</span>P for your filesystem.
        </h1>
        <span className="og-caps">
          <Cap>Ctrl</Cap>
          <span className="chord-plus">+</span>
          <Cap>P</Cap>
        </span>
      </div>
      <Screen className="og-shot">
        {/* eslint-disable-next-line @next/next/no-img-element -- capture-only card */}
        <img src="/tauri/og-shot.webp" alt="" />
      </Screen>
    </div>
  );
}

export default async function OgCard({ params }: { params: Promise<{ card: string }> }) {
  const { card } = await params;
  const body = card === "home" ? <HomeCard /> : card === "tauri-explorer" ? <TauriCard /> : null;
  if (!body) notFound();
  return <div className="og-stage">{body}</div>;
}
