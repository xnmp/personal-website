import {
  RunningHead,
  Plate,
  Folio,
} from "@/components/notebook";
import { ZsyGame } from "@/components/zsy/ZsyGame";
import { Key } from "@/components/rack";

export const metadata = {
  title: "Play Zheng Shang You against the strategist",
  description:
    "Play the 4-player climbing card game against three copies of the scripted strategist, the same baseline the neural network was cloned from.",
};

export default function ZsyPlayPage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            10 &nbsp;·&nbsp; Zheng Shang You &nbsp;·&nbsp; <span className="filed">playable</span>
          </>
        }
        nav={
          <>
            <Key href="/p/zheng-shang-you">← the project</Key>
            <Key href="/">← all projects</Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <div className="kicker">10 · Zheng Shang You · playable appendix</div>
            <h1>Shed your hand first.</h1>
            <p>
              Three opponents, each running the scripted strategist: the same
              baseline the network was cloned from, the one that holds 0.469
              against naive play. Beat the last combination or pass; bombs beat
              everything; first out goes up.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The rules, briefly</div>
            <h2>How to play</h2>
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
                <strong>Pick cards</strong> to raise them; the play button
                names what you’ve selected. When everyone passes, the
                trick clears and the last player leads fresh.
              </li>
            </ul>
          </div>
          <div>
            <Plate
              figure="FIG. A · The table"
              caption="Fig. A: the engine is the TypeScript port of the training environment, and the opponents are the strategist heuristic, which is deterministic."
            >
              <ZsyGame />
            </Plate>
          </div>
        </section>

      </main>
      <Folio number="10" />
    </>
  );
}
