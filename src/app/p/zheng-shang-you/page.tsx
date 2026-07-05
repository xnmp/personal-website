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
import { ZsyLadder } from "@/components/charts/ZsyLadder";
import { ZsyRuns } from "@/components/charts/ZsyRuns";

export const metadata = {
  title: "Zheng Shang You — Chong",
  description:
    "An RL pipeline for a 4-player Chinese climbing card game: zero-signal self-play, behaviour cloning, a perfect-information critic, a generational league, and a search whose best lever was variance.",
};

export default function ZsyPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-3.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry III &nbsp;·&nbsp; Zheng Shang You &nbsp;·&nbsp; filed under{" "}
            <span className="filed">games · AI</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 03 · Entry III</div>
          <h1>Teaching a network the family card game.</h1>
          <p>
            Zheng Shang You is a 4-player climbing game — shed your hand
            first, beat the last combination or pass, bombs outrank
            everything. The rules took a week. Getting a gradient to point
            anywhere took months, and the training log keeps every wrong turn.
          </p>
        </div>
        <Tags>
          <Tag>pytorch</Tag>
          <Tag>ppo + bc</Tag>
          <Tag>league self-play</Tag>
          <Tag>rust engine</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — The dead end</div>
          <h3>Self-play with zero signal</h3>
        </div>
        <div>
          <p>
            The obvious approach — DouZero-style deep Monte Carlo self-play —
            produced a result worth framing: <strong>every network scored
            ~33% regardless of quality</strong>. In symmetric multiplayer
            self-play, when all seats improve together, relative win rate is
            flat and the gradient carries no information. The training log
            records it, dates it, and moves on.
          </p>
          <p>
            What replaced it is a recipe, and each step is measurable: clone
            the behaviour of a scripted strategist to warm-start; fine-tune
            with PPO regularized back toward the clone; give the <em>critic</em>{" "}
            perfect information (it sees all hands during training — the
            policy never does) for a lower-variance baseline; shape rewards
            with a dynamic-programming oracle for minimum-steps-to-shed,
            2.6ms per game, 90% cache hit rate.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — Figure I</div>
          <h3>The recipe, one fix at a time</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Win rate in a 4-player ring against three scripted strategists.
            Seat parity is 0.25 — anything above it is real skill.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. I — From cloning to search"
            caption="Fig. I — every step is one dated fix from the training log. The last one — determinized search on top of the policy — is worth ten points on its own."
          >
            <ZsyLadder />
          </Plate>
          <p style={{ marginTop: 20 }}>
            The search deserves its own footnote. Rolling out D=6
            determinized worlds and scoring <em>win/loss</em> gave zero lift.
            The fix wasn&rsquo;t depth: score rollouts by <em>final rank</em>{" "}
            (1.0 / 0.45 / 0.225 / 0) and D=32 is worth +10 points. The
            estimator&rsquo;s variance was the problem all along — a very
            card-game lesson, where second place and fourth place look
            identical to a win/loss signal.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ III&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ III — Figure II</div>
          <h3>Generations, honestly</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Training win rate by iteration across the league runs — including
            the ones that went nowhere.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. II — League self-play runs"
            caption="Fig. II — gen-1 reached 0.471 (1,000 games, CI [0.44, 0.50]); gen-2 beats three gen-1s at 0.409 over 450 games; gen-3 is currently flat, and the log says so."
          >
            <ZsyRuns />
          </Plate>
          <p style={{ marginTop: 20 }}>
            Each generation trains against a mixture of the frozen previous
            champion, past snapshots, and itself — pure fixed-opponent
            training plateaus, pure self-play collapses, the league keeps the
            gradient pointed at the actual target. Gen-3 is the live negative
            result: five checkpoints of flat proxy matchups against a
            same-class anchor, and an open diagnosis — the 512×4 policy class
            may simply be saturated.
          </p>
          <p>
            Supporting cast: a PyO3 Rust engine that simulates a game in
            0.15ms (14× Python, but only once whole workloads were batched
            across the boundary), and a behaviour-cloning pipeline that
            OOM-killed the desktop — wildcard hands can have thousands of
            legal moves — until cross-entropy against 24 sampled distractors
            bounded the memory at equal quality.
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
            Gen-3&rsquo;s proxy matchups are flat against a same-class anchor.
            Saturated policy class, or a league that no longer generates
            informative opponents? The next experiment measures pure
            search-depth asymmetry (D=64 vs D=48) to separate the two.
          </OpenQuestion>
          <OpenQuestion label="Open question II">
            Winning games average 1.5 bombs; second-place games average 1.0.
            Early bombing is a feature, not a bug — the real loss mode is
            passive endgame racing. Can a reward term see that without
            hand-coding it?
          </OpenQuestion>
        </div>
      </section>

      <section className="colophon">
        <div>
          Materials<strong>PyTorch, Rust/PyO3, Python</strong>
        </div>
        <div>
          Vintage<strong>MMXXVI — in training</strong>
        </div>
        <div>
          Scale<strong>~14k LoC · 3 generations · 0.15ms/game</strong>
        </div>
        <div>
          Source
          <strong>
            <a href="https://github.com/xnmp/zheng-shang-you">
              github/xnmp/zheng-shang-you
            </a>
          </strong>
        </div>
      </section>

      <Folio number="3" />
    </>
  );
}
