import { RunningHead, Tags, Tag, OpenQuestion, Plate, Folio, ProjectMeta, ProjectKicker } from "@/components/notebook";
import { Screen, Key } from "@/components/rack";
import { EskivQ1 } from "@/components/charts/EskivQ1";
import { EskivQ2 } from "@/components/charts/EskivQ2";
import { EskivQ3 } from "@/components/charts/EskivQ3";
import { VideoScreen } from "@/components/rack/VideoScreen";

export const metadata = {
  title: "Eskiv: a brute-force AI that plays a dodger",
  description:
    "A dodger game and its brute-force AI. 10,000 games, three questions, three plates: path ratio vs clutter, where the agent stands, and how it dies.",
};

export default function EskivPage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={<ProjectMeta slug="eskiv" />}
        nav={
          <>
            <Key href="/">← all projects</Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="eskiv" />
            <h1>A brute-force AI that plays a dodger.</h1>
            <p>
              Eskiv is a 2016 game: you move a square, dodge balls, grab a new
              square each tick. Every pickup spawns another ball, so the field
              fills up until the agent can’t find a safe path home. Ten
              thousand games, one brute-force agent with{" "}
              <code>lookahead=100</code>, three plates of how it behaves.
            </p>
          </div>
          <div>
            <Screen art="/screens/eskiv.png" tone="olive" />
            <Tags>
              <Tag>python</Tag>
              <Tag>pygame</Tag>
              <Tag>brute-force search</Tag>
              <Tag>game from 2016</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The game</div>
            <h2>What you’re watching</h2>
          </div>
          <div>
            <Plate
              figure="FIG. 0 · One game, played at speed"
              caption="A recording of the brute-force agent playing, on YouTube (about 10 minutes)."
            >
              <VideoScreen
                id="XvFl7R0Q5kE"
                title="Eskiv: brute-force AI playthrough"
                art="/screens/eskiv-run.png"
                label="Watch the run"
              />
            </Plate>
            <p style={{ marginTop: 20 }}>
              The large square is the player. The circles are enemies; they
              bounce and accelerate, and there are more of them every second.
              Small squares are pickups worth one point each. (In the recording
              the player is grey, the enemies blue and the pickups light grey.) The agent searches over
              reachable pickup targets and picks the one whose safe-neighbourhood
              survives the next hundred ticks of simulation. When no such target
              exists, the game ends.
            </p>
          </div>
        </section>


        <section className="section">
          <div>
            <div className="section-kicker">The setup</div>
            <h2>10,000 games, three questions</h2>
          </div>
          <div>
            <p>
              The engine was rewritten headless (vectorised enemies, no pygame
              in the hot loop), so ten thousand 5-minute games finish in an
              afternoon. Every frame of every game is saved. Three questions,
              chosen because I was curious and the answers weren’t obvious
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
                &nbsp;Does a brute-force agent with no notion of “danger
                zones” still discover them empirically?
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
            <div className="section-kicker">Path ratio</div>
            <h2>Path ratio vs clutter</h2>
            <p className="aside-note">
              Straight-line distance divided by actual path walked, per pickup.
              1.0 means the agent walked a straight line. Bucketed by how many
              balls were on the field at the time.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 1 · 742,146 pickups across 10,000 games"
              caption="Mean ratio (line), interquartile range (band), sample count (bars)."
            >
              <EskivQ1 />
            </Plate>
            <p style={{ marginTop: 20 }}>
              With an empty field the agent walks at ~76% of the straight line,
              not 100%, because it’s already dodging a few enemies. By the
              time there are 60+ balls it’s down to 40%, and at 100+ it’s
              taking routes more than four times longer than the crow flies.
              The fall-off is smooth and roughly linear from ~20 balls onward.
              Not surprising, but this is the shape of the concession.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Where it stands</div>
            <h2>Where the agent stands</h2>
            <p className="aside-note">
              Player-position density by score bucket. Log-smoothed, 16.4 million
              samples. Auto-scrubs through the game’s life.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 2 · 12 score buckets, smoothed density"
              caption="Top-left is the top-left corner of the game field. Watch it crawl to the walls."
            >
              <EskivQ2 />
            </Plate>
            <p style={{ marginTop: 20 }}>
              Up to about 200 points the agent hugs the centre, which gives maximum
              optionality and minimum wall risk. Somewhere between 300 and 400 it
              flips: the centre becomes so ball-dense that the only safe
              pockets are against the edges. By the time scores hit 500 it’s
              spending most of its steps pinned to a single wall.
              Nobody told the agent to do this. It’s
              where an agent that only minimises immediate risk ends up.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">How it dies</div>
            <h2>How it dies</h2>
            <p className="aside-note">
              Final score per game. Brute agent, <code>lookahead=100</code>,
              small field.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 3 · 10,000 games · mean 381.1 · median 385"
              caption="Every death was by trap; zero deaths by direct hit."
            >
              <EskivQ3 />
            </Plate>
            <p style={{ marginTop: 20 }}>
              The distribution is tight: stddev 58, p10–p90 range
              of ~310–445. More striking, <strong>not a single game</strong>{" "}
              ended by getting hit. Every death was a trap, with the search raising{" "}
              <code>DeathError</code> because no target had a safe enough
              100-step future. The agent dodges perfectly right up until it
              corners itself, a very specific failure mode of
              conservative search.
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
              If the agent never gets hit, it’s over-spending its
              lookahead on safety. What’s the smallest lookahead that
              preserves the <code>n_hit=0</code> property, and does the score
              distribution stay this tight?
            </OpenQuestion>
            <OpenQuestion label="Open question II">
              The corner-stickiness in late game emerges without being designed
              in. Would an RL agent (DQN, PPO) discover the same strategy, or
              does the value function let it take risks a brute search
              won’t?
            </OpenQuestion>
            <OpenQuestion label="Open question III">
              The path-ratio curve bends smoothly through ~20 balls. Is there
              a principled ball-density above which straight-line motion is
              provably unsafe, like a critical percolation threshold for a moving
              agent?
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Python, NumPy, SciPy, pygame</strong>
          </div>
          <div>
            Vintage<strong>2016, analysis 2026</strong>
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

      </main>
      <Folio slug="eskiv" />
    </>
  );
}
