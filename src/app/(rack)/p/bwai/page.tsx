import type { Metadata } from "next";
import Link from "next/link";
import {
  RunningHead,
  Tags,
  Tag,
  OpenQuestion,
  Plate,
} from "@/components/notebook";
import { Cap, Screen } from "@/components/rack";
import { BwaiBench } from "@/components/charts/BwaiBench";

export const metadata: Metadata = {
  title: "Brood War: an agent and a voided win rate",
  description:
    "An AlphaStar-inspired agent for StarCraft: Brood War. A 40,000 fps engine, behaviour cloning from 6,770 pro replays, and an earlier 76% win rate that turned out to be measured against a broken opponent. The honest number is about 6%.",
};

const REBASELINE = `re-baseline vs the fixed opponent, n=50 per arm, seeds 7450-7499
(W-L-D at the standard 43,200-frame cap)

  arm                         T     W-L-D      win rate
  champion_bc_v4              0.8   3-34-13       6%
  champion_bc_v4              1.0   2-30-18       4%
  gas retrain (e2)            0.8   4-36-10       8%
  bc_v5, 18.7M params         0.8   1-32-17       2%
  champion + executor fix     0.8   3-35-12       6%

  champion_bc_v4 at T=0.5: 0-47-3 (0%) in the 26 Jul run`;

export default function BwaiPage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={
          <>
            08 &nbsp;·&nbsp; Brood War &nbsp;·&nbsp; <span className="filed">active</span>
          </>
        }
        nav={
          <>
            <Link href="/">← the rack</Link>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <div className="kicker">08 · Brood War</div>
            <h1>The game that taught me to think, now a machine-learning problem.</h1>
            <p>
              I played Brood War competitively once. Twenty years later the
              question is different: with public algorithms, a dead tooling
              ecosystem, and one desktop, how far can imitation plus a
              self-play league get on one map, one matchup? The project began
              not with code but with an audit of whether it’s feasible at
              all.
            </p>
          </div>
          <div>
            <Screen art="/screens/bwai.png" tone="cyan" />
            <Tags>
              <Tag>openbw</Tag>
              <Tag>c++ / pybind11</Tag>
              <Tag>behaviour cloning</Tag>
              <Tag>stages 0 to 3 done</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Before any code</div>
            <h2>The feasibility audit</h2>
          </div>
          <div>
            <p>
              The first artifact in the repo is a research report, not a
              module: a sourced audit of the AlphaStar-for-Brood-War
              literature: claims extracted, a sample adversarially fact-checked, compute costs tiered from hobbyist to industrial. Its conclusions set the scope. The algorithms are public and reproducible, and the walls are a compute cliff (TStarBot-X used 144
              V100s for 57 days at 1/30th of AlphaStar’s budget) and a
              replay corpus twenty times smaller than DeepMind’s.
            </p>
            <p>
              So the project follows the report’s own first
              recommendation: <strong>benchmark the unglamorous thing
              first</strong>. Behaviour cloning and offline RL on one map,
              macro-actions before raw actions, and a staged plan where each
              stage can falsify the next.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Stage 0</div>
            <h2>Stage 0: is the engine fast enough?</h2>
            <p className="aside-note">
              Aggregate OpenBW frames per second by parallel instance count,
              12-core desktop.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 1 · 40,000 frames a second"
              caption="Fig. 1: roughly 3,400 games an hour before GPU inference enters the loop. Verdict from the bench notes: the engine is not the bottleneck."
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


        <section className="section">
          <div>
            <div className="section-kicker">The vocabulary</div>
            <h2>Recovering intent from replays</h2>
          </div>
          <div>
            <p>
              Replays record commands, not decisions. Stage 2 is a
              hand-designed vocabulary of ~24 macro-actions (train, build, expand, attack, retreat, harass, merge archons) acting every 6
              frames, a deliberately human-plausible decision rate. An inverse
              labeler walks each pro replay’s command stream and recovers
              which macro-action explains it:{" "}
              <strong>92.7% of commands accounted for</strong> on a 200-replay
              sample, with the residue itemized (selection bookkeeping, worker
              micro, unconsumed).
            </p>
            <p>
              Stage 3’s smoke test was a deliberately tiny 1.76M-parameter model (per-entity MLP with masked pooling, a small spatial CNN, scalar trunk) driven to 98% training accuracy over 3,164 cached windows on one CPU thread. It was a proof that the observation and label pipeline carries learnable signal before any GPU-hours were spent on it.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The re-baseline</div>
            <h2>My 76% was measured against a broken opponent</h2>
            <p className="aside-note">
              Sources: <code>CURRENT_STATE.md</code>, <code>HISTORY.md</code> (26 and
              27 Jul 2026), <code>DECISION_RECORD.md</code>.
            </p>
          </div>
          <div>
            <p>
              The current champion is <code>champion_bc_v4.pt</code>: 10.3M
              parameters, flat architecture, trained on the full corpus for 8
              epochs. For a while I reported it at about 76% against the scripted
              opponent (229 of 300 paired games). That number is void.
            </p>
            <p>
              The opponent was an OpenBW port of Blizzard’s Protoss AI
              script, and my interpreter for it was wrong. A filter I had written
              over the instruction stream dropped all 32 <code>wait_buildstart</code>{" "}
              barriers, so the script never waited for its probes. It built its
              first pylon at frame 408 and its fifth probe at frame 1914. Every
              win rate in the project’s history had been measured against
              that crippled opponent. I fixed the interpreter and re-ran
              everything.
            </p>
            <p>
              Against the fixed opponent the champion won 0 of 50 games at its old
              temperature of 0.5, and 3 of 50 at 0.8, with 13 draws. That is 3-34-13,
              about 6%, on the standard 43,200-frame cap.
            </p>
            <Plate
              figure="FIG. 2 · nine paired arms against the fixed opponent"
              caption="From HISTORY.md, 27 Jul 2026 (five arms shown). Same seeds in every arm, so differences are paired. Net wins against the champion at T=0.8: gas +1 (p=1.0), bc_v5 -2 (p=0.625), executor fix 0 (p=1.0)."
            >
              <pre>
                <code>{REBASELINE}</code>
              </pre>
            </Plate>
            <p>
              None of the levers I had been counting on moved it. The gas retrain
              does mine gas, but it floats it in half its games, so what is missing is
              spending, not mining. The larger bc_v5 model had looked 6 points
              better than the champion, and against the fixed opponent it scores
              2%, net -2 against the champion. The executor fix for build tasks
              that never expire cut BUILD_QUEUE_STUCK from 26.5% to 14% and won no
              extra games. I kept it because it is correct, not because it is
              stronger.
            </p>
            <p>
              The 0% at T=0.5 was a collapse I had to chase. From around frame
              1500 the policy goes almost entirely to NoOp, because a static base
              gives a static observation, which gives NoOp again. I had picked
              T=0.5 by sweeping against the broken opponent, so the sampling
              recipe was part of the void too. In a 9-game sweep T=0.8 and 1.0 did
              not collapse (0 of 6).
            </p>
            <p>
              Corrections are made in place. HISTORY.md keeps an index of
              superseded numbers next to the true ones, and DECISION_RECORD.md
              says a number that is quietly deleted gets independently re-derived
              by the next person. As of 27 July there is no live champion
              candidate. Stage 4 is marked unresolved, not negative, because its
              earlier verdicts were also measurement artifacts. CURRENT_STATE.md
              counts 235 tests; collecting the suite on 6 October finds 312.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The rough edges</div>
            <h2>Open questions</h2>
          </div>
          <div>
            <OpenQuestion>
              6,770 PvP replays is 20× less than AlphaStar had. Where exactly
              does imitation stop being enough on one map, and can a league of
              behaviour-cloned seeds generate the rest of the curriculum?
            </OpenQuestion>
            <OpenQuestion label="Open question II">
              Macro-actions cap the agent at human-plausible mechanics, which
              is the honest comparison. Every superhuman StarCraft result I know of relaxed this somewhere. Is there a clean boundary, or
              only disclosure?
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>C++, pybind11, PyTorch, OpenBW</strong>
          </div>
          <div>
            Vintage<strong>2026, stages 0 to 3 done, stage 4 open</strong>
          </div>
          <div>
            Scale<strong>40k fps · 6,770 replays · 10.3M-param champion</strong>
          </div>
          <div>
            Source<strong>private</strong>
          </div>
        </section>

      </main>
      <footer className="folio">
        <span className="fine-only">
          Press <Cap>/</Cap> for the other modules
        </span>
        <span>08 / 11</span>
      </footer>
    </>
  );
}
