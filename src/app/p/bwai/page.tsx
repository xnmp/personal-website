import Link from "next/link";
import {
  RunningHead,
  Divider,
  Tags,
  Tag,
  OpenQuestion,
  Plate,
  Folio,
  PageBackground,
} from "@/components/notebook";
import { BwaiBench } from "@/components/charts/BwaiBench";

export const metadata = {
  title: "Brood War — Chong",
  description:
    "An AlphaStar-inspired agent for StarCraft: Brood War, begun with a feasibility audit and a 40,000 fps engine benchmark. Behaviour cloning from 6,770 pro replays, one map, PvP.",
};

export default function BwaiPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-1.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry VI &nbsp;·&nbsp; Brood War &nbsp;·&nbsp; filed under{" "}
            <span className="filed">games · AI · history</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 06 · Entry VI</div>
          <h1>The game that taught me to think, revisited as a problem.</h1>
          <p>
            I played Brood War competitively once. Twenty years later the
            question is different: with public algorithms, a dead tooling
            ecosystem, and one desktop, how far can imitation plus a
            self-play league get on one map, one matchup? The project began
            not with code but with an audit of whether it&rsquo;s feasible at
            all.
          </p>
        </div>
        <Tags>
          <Tag>openbw</Tag>
          <Tag>c++ / pybind11</Tag>
          <Tag>behaviour cloning</Tag>
          <Tag>stage 2 of 6</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — Before any code</div>
          <h3>The feasibility audit</h3>
        </div>
        <div>
          <p>
            The first artifact in the repo is a research report, not a
            module: a sourced audit of the AlphaStar-for-Brood-War
            literature — claims extracted, a sample adversarially
            fact-checked, compute costs tiered from hobbyist to industrial.
            Its conclusions set the scope: the algorithms are public and
            reproducible; the walls are a compute cliff (TStarBot-X used 144
            V100s for 57 days at 1/30th of AlphaStar&rsquo;s budget) and a
            replay corpus twenty times smaller than DeepMind&rsquo;s.
          </p>
          <p>
            So the project follows the report&rsquo;s own first
            recommendation: <strong>benchmark the unglamorous thing
            first</strong>. Behaviour cloning and offline RL on one map,
            macro-actions before raw actions, and a staged plan where each
            stage can falsify the next.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — Figure I</div>
          <h3>Stage 0: is the engine fast enough?</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Aggregate OpenBW frames per second by parallel instance count,
            12-core desktop.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. I — 40,000 frames a second"
            caption="Fig. I — roughly 3,400 games an hour before GPU inference enters the loop. Verdict from the bench notes: the engine is not the bottleneck."
          >
            <BwaiBench />
          </Plate>
          <p style={{ marginTop: 20 }}>
            TorchCraft and STARDATA tooling were archived by Meta in 2022, so
            the bridge is rebuilt from scratch: a single-translation-unit
            pybind11 layer exposing a fogged-observation replay reader and a
            two-player melee environment over OpenBW. The pipeline validated
            6,770 of 6,943 professional PvP replays for the corpus.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ III&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ III — The vocabulary</div>
          <h3>Recovering intent from replays</h3>
        </div>
        <div>
          <p>
            Replays record commands, not decisions. Stage 2 is a
            hand-designed vocabulary of ~24 macro-actions — train, build,
            expand, attack, retreat, harass, merge archons — acting every 6
            frames, a deliberately human-plausible decision rate. An inverse
            labeler walks each pro replay&rsquo;s command stream and recovers
            which macro-action explains it:{" "}
            <strong>92.7% of commands accounted for</strong> on a 200-replay
            sample, with the residue itemized (selection bookkeeping, worker
            micro, unconsumed).
          </p>
          <p>
            Stage 3&rsquo;s smoke test: a deliberately tiny 1.76M-parameter
            model — per-entity MLP with masked pooling, a small spatial CNN,
            scalar trunk — driven to 98% training accuracy over 3,164 cached
            windows on one CPU thread. Not a policy; a proof that the
            observation and label pipeline carries learnable signal before
            any GPU-hours are spent on it.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ IV — The rough edges</div>
          <h3>Open questions</h3>
        </div>
        <div>
          <OpenQuestion>
            6,770 PvP replays is 20× less than AlphaStar had. Where exactly
            does imitation stop being enough on one map — and can a league of
            behaviour-cloned seeds generate the rest of the curriculum?
          </OpenQuestion>
          <OpenQuestion label="Open question II">
            Macro-actions cap the agent at human-plausible mechanics, which
            is the honest comparison. But every superhuman StarCraft result
            cheated on this axis somewhere. Is there a clean boundary, or
            only disclosure?
          </OpenQuestion>
        </div>
      </section>

      <section className="colophon">
        <div>
          Materials<strong>C++, pybind11, PyTorch, OpenBW</strong>
        </div>
        <div>
          Vintage<strong>MMXXVI — stage 2 of 6</strong>
        </div>
        <div>
          Scale<strong>40k fps · 6,770 replays · 92.7% labeled</strong>
        </div>
        <div>
          Source
          <strong>
            <a href="https://github.com/xnmp/bwai">github/xnmp/bwai</a>
          </strong>
        </div>
      </section>

      <Folio number="6" />
    </>
  );
}
