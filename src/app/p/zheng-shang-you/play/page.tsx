import Link from "next/link";
import {
  RunningHead,
  Plate,
  Folio,
  PageBackground,
} from "@/components/notebook";
import { ZsyGame } from "@/components/zsy/ZsyGame";

export const metadata = {
  title: "Play Zheng Shang You — Chong",
  description:
    "Play the 4-player climbing card game against three copies of the scripted strategist — the same baseline the neural network was cloned from.",
};

export default function ZsyPlayPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-3.jpg" />
      <RunningHead
        brand="chong"
        meta={
          <>
            Entry III &nbsp;·&nbsp; appendix &nbsp;·&nbsp; filed under{" "}
            <span className="filed">playable</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/p/zheng-shang-you">← the entry</Link>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <Link href="/">the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 03 · Appendix — playable</div>
          <h1>Shed your hand first.</h1>
          <p>
            Three opponents, each running the scripted strategist — the same
            baseline the network was cloned from, the one that holds 0.469
            against naive play. Beat the last combination or pass; bombs beat
            everything; first out goes up.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ — The rules, briefly</div>
          <h3>How to play</h3>
          <ul style={{ marginTop: 12 }}>
            <li>
              <strong>Combinations:</strong> singles, pairs, triples, full
              houses, straights of 5+, consecutive pairs and triples.
            </li>
            <li>
              <strong>Order:</strong> 3 lowest … A, then 2, then the jokers.
            </li>
            <li>
              <strong>Bombs</strong> (four or more of a kind, straight
              flushes) beat any ordinary combination; bigger bombs beat
              smaller.
            </li>
            <li>
              <strong>Click cards</strong> to raise them; the play button
              names what you&rsquo;ve selected. When everyone passes, the
              trick clears and the last player leads fresh.
            </li>
          </ul>
        </div>
        <div>
          <Plate
            figure="FIG. A — The table"
            caption="Fig. A — the engine is the TypeScript port of the training environment; the opponents are the strategist heuristic, deterministic and unbothered."
          >
            <ZsyGame />
          </Plate>
        </div>
      </section>

      <Folio number="3a" />
    </>
  );
}
