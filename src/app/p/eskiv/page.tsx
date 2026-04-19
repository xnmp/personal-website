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
import { EskivQ1 } from "@/components/charts/EskivQ1";
import { EskivQ2 } from "@/components/charts/EskivQ2";
import { EskivQ3 } from "@/components/charts/EskivQ3";

export const metadata = {
  title: "Eskiv — Chong",
  description:
    "A dodger game and its brute-force AI. 10,000 games, three questions, three plates — path ratio vs clutter, where the agent stands, and how it dies.",
};

export default function EskivPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-3.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry II &nbsp;·&nbsp; Eskiv &nbsp;·&nbsp; filed under{" "}
            <span className="filed">games · AI</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 02 · Entry II</div>
          <h1>A brute-force AI that plays a dodger.</h1>
          <p>
            Eskiv is a 2016 game: you move a square, dodge balls, grab a new
            square each tick — every pickup spawns another ball, so the field
            fills up until the agent can&rsquo;t find a safe path home. Ten
            thousand games, one brute-force agent with{" "}
            <code>lookahead=100</code>, three plates of how it behaves.
          </p>
        </div>
        <Tags>
          <Tag>python</Tag>
          <Tag>pygame</Tag>
          <Tag>brute-force search</Tag>
          <Tag>MMXVI — ongoing</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — The game</div>
          <h3>What you&rsquo;re watching</h3>
        </div>
        <div>
          <Plate
            figure="FIG. 0 — One game, played at speed"
            caption="A single 300-second run from the brute-force agent."
          >
            <div className="video-frame">
              <iframe
                src="https://www.youtube.com/embed/XvFl7R0Q5kE"
                title="Eskiv — brute-force AI playthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </Plate>
          <p style={{ marginTop: 20 }}>
            Grey square is the player. Blue circles are enemies — they bounce,
            accelerate, and there are more of them every second. Light grey
            squares are pickups worth one point each. The agent searches over
            reachable pickup targets and picks the one whose safe-neighbourhood
            survives the next hundred ticks of simulation. When no such target
            exists, the game ends.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ II&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — The setup</div>
          <h3>10,000 games, three questions</h3>
        </div>
        <div>
          <p>
            The engine was rewritten headless — vectorised enemies, no pygame
            in the hot loop — so ten thousand 5-minute games finish in an
            afternoon. Every frame of every game is saved. Three questions,
            chosen because I was curious and the answers weren&rsquo;t obvious
            from watching one game:
          </p>
          <ol>
            <li>
              <strong>Does the agent move in straight lines?</strong>
              &nbsp;How close to the shortest route does it actually walk,
              and does that change as the field gets crowded?
            </li>
            <li>
              <strong>Where does it spend its time?</strong>
              &nbsp;Does a brute-force agent with no notion of &ldquo;danger
              zones&rdquo; still discover them empirically?
            </li>
            <li>
              <strong>How does it die?</strong>
              &nbsp;Is it mostly clipped by fast enemies, or does it trap
              itself in corners when the field fills up?
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ III — Figure I</div>
          <h3>Path ratio vs clutter</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Straight-line distance divided by actual path walked, per pickup.
            1.0 means the agent walked a straight line. Bucketed by how many
            balls were on the field at the time.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. I — 742,146 pickups across 10,000 games"
            caption="Mean ratio (line), interquartile range (band), sample count (bars)."
          >
            <EskivQ1 />
          </Plate>
          <p style={{ marginTop: 20 }}>
            With an empty field the agent walks at ~76% of the straight line —
            not 100% because it&rsquo;s already dodging a few enemies. By the
            time there are 60+ balls it&rsquo;s down to 40%, and at 100+ it&rsquo;s
            taking routes more than four times longer than the crow flies.
            The fall-off is smooth and roughly linear from ~20 balls onward.
            Not surprising, but this is the shape of the concession.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ IV — Figure II</div>
          <h3>Where the agent stands</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Player-position density by score bucket. Log-smoothed, 16.4 million
            samples. Auto-scrubs through the game&rsquo;s life.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. II — 12 score buckets, smoothed density"
            caption="Top-left is the top-left corner of the game field. Watch it crawl to the walls."
          >
            <EskivQ2 />
          </Plate>
          <p style={{ marginTop: 20 }}>
            Up to about 200 points the agent hugs the centre — maximum
            optionality, minimum wall risk. Somewhere between 300 and 400 it
            flips: the centre becomes so ball-dense that the only safe
            pockets are against the edges. By the time scores hit 500 it&rsquo;s
            spending most of its steps pinned to a single wall.
            It&rsquo;s not a strategy the agent was told about — it&rsquo;s
            where an agent that only minimises immediate risk ends up.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ V — Figure III</div>
          <h3>How it dies</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            Final score per game. Brute agent, <code>lookahead=100</code>,
            small field.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. III — 10,000 games · mean 381.1 · median 385"
            caption="Every death was by trap; zero deaths by direct hit."
          >
            <EskivQ3 />
          </Plate>
          <p style={{ marginTop: 20 }}>
            The distribution is remarkably tight — stddev 58, p10–p90 range
            of ~310–445. More striking: <strong>not a single game</strong>{" "}
            ended by getting hit. Every death was a trap: the search raised{" "}
            <code>DeathError</code> because no target had a safe enough
            100-step future. The agent dodges perfectly right up until it
            corners itself — which is a very specific failure mode of
            conservative search.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ VI — The rough edges</div>
          <h3>Open questions</h3>
        </div>
        <div>
          <OpenQuestion>
            If the agent never gets hit, it&rsquo;s over-spending its
            lookahead on safety. What&rsquo;s the smallest lookahead that
            preserves the <code>n_hit=0</code> property — and does the score
            distribution stay this tight?
          </OpenQuestion>
          <OpenQuestion label="Open question II">
            The corner-stickiness in late game emerges without being designed
            in. Would an RL agent (DQN, PPO) discover the same strategy, or
            does the value function let it take risks a brute search
            won&rsquo;t?
          </OpenQuestion>
          <OpenQuestion label="Open question III">
            The path-ratio curve bends smoothly through ~20 balls. Is there
            a principled ball-density above which straight-line motion is
            provably unsafe — a kind of critical percolation for a moving
            agent?
          </OpenQuestion>
        </div>
      </section>

      <section className="colophon">
        <div>
          Materials<strong>Python, NumPy, SciPy, pygame</strong>
        </div>
        <div>
          Vintage<strong>MMXVI — analysis MMXXVI</strong>
        </div>
        <div>
          Scale<strong>10,000 games · 16.4M steps · 742k pickups</strong>
        </div>
        <div>
          Source
          <strong>
            <a href="https://github.com/xnmp/Eskiv_new">
              github/xnmp/Eskiv_new
            </a>
          </strong>
        </div>
      </section>

      <Folio number="2" />
    </>
  );
}
