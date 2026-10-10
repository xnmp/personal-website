import type { Metadata } from "next";
import { RunningHead, Tags, Tag, OpenQuestion, Plate, Features, Feature, ProjectMeta, ProjectKicker, Folio } from "@/components/notebook";
import { Screen, Key } from "@/components/rack";

export const metadata: Metadata = {
  title: "AutomatedSpike: Magic decks nobody has built yet",
  description:
    "Research into finding inventive Magic: The Gathering Modern decks and training agents to pilot them. So far it works on a restricted starter pool, with confidence bounds on every claim and a list of what failed.",
};

const RESULTS = `800-game check, frozen heuristic teacher
(Hoeffding lower bounds, simultaneous)

                 opponent   wins / n    lower
  24 Plains      random     200 / 200   0.880
  24 Plains      naive      190 / 200   0.830
  26 Plains      random     200 / 200   0.880
  26 Plains      naive      184 / 200   0.800

gate: lower bound > 0.55 in every stratum  -> passed`;

const LEARNED = `learned combat student, 304 games, 16 per cell

                       random  naive  teacher
  untrained scorer      15/16   5/16    0/16
  behaviour cloning     16/16  12/16    3/16
  + 4 RL batches        16/16  13/16    4/16`;

export default function AutomatedSpikePage() {
  return (
    <>
      <RunningHead
        brand="chong"
        meta={<ProjectMeta slug="automatedspike" />}
        nav={
          <>
            <Key href="/">← all projects</Key>
          </>
        }
      />
      <main id="content" className="rack-main" tabIndex={-1}>

        <section className="detail-hero">
          <div>
            <ProjectKicker slug="automatedspike" />
            <h1>Looking for Magic decks nobody has built yet, and agents that can pilot them.</h1>
            <p>
              This is research into finding inventive decks for Magic: The Gathering
              Modern, and into training agents that can actually play them. You cannot
              tell whether a new deck is good until something plays it well, so the two
              problems have to be solved together.
            </p>
            <p>
              Full Modern is not working yet. The card pool the engine supports today is
              Plains and nine vanilla creatures. Everything below is true inside that
              small world.
            </p>
          </div>
          <div>
            <Screen art="/screens/automatedspike.png" tone="amber" />
            <Tags>
              <Tag>python</Tag>
              <Tag>xmage</Tag>
              <Tag>argentum</Tag>
              <Tag>behaviour cloning</Tag>
              <Tag>reinforcement learning</Tag>
            </Tags>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The shape</div>
            <h2>Brewer, pilot, evaluator, environment</h2>
            <p className="aside-note">
              From <code>docs/mission-and-architecture.md</code> and the layout of{" "}
              <code>src/automated_spike/</code>.
            </p>
          </div>
          <div>
            <p>
              Four parts with separate jobs. The brewer proposes legal deck changes. The
              pilot chooses actions from what a player is allowed to see. The evaluator
              schedules games, computes uncertainty and decides whether a result counts.
              The environment runs the rules and produces replays. The package mirrors
              that: <code>brewer</code>, <code>pilot</code>, <code>evaluation</code>,{" "}
              <code>environment</code>, <code>domain</code>, <code>corpus</code> and{" "}
              <code>infrastructure</code>.
            </p>
            <p>
              Two rules from the design matter most. The brewer cannot change the
              evaluation criteria after seeing results, and the pilot never receives
              engine state or the opponent’s hand, only an immutable observation.
            </p>
            <p>
              Two real engines are pinned next to the Python: XMage and Argentum, both
              built locally under <code>integrations/</code>. On a panel of 202 card names
              from twelve real decks, XMage had 191 by exact name and Argentum had 103,
              so XMage is the one I am qualifying for Modern. Argentum stays as a smaller
              comparator. I also found it accepting illegal damage underassignment in a
              fixture, which is recorded in <code>argentum-pinned-audit.md</code>.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The starter engine</div>
            <h2>Small on purpose, and strict about it</h2>
          </div>
          <div>
            <p>
              Until an upstream engine could run here I wrote a starter engine in
              Python. It implements the real rules that apply to its pool: priority, the
              stack, explicit mana payment, London mulligans, summoning sickness, full
              attack and block declarations, arbitrary legal damage assignment, and
              state-based actions. Anything outside the whitelist is rejected when the
              game resets.
            </p>
            <p>
              It is deterministic. Every game saves its action transcript and
              observation hashes, and a replay re-executes the actions against the
              engine to check them. The audit of the main confirmation run reproduced
              800 of 800 engine transcripts and 800 of 800 policy reruns.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The pilots</div>
            <h2>A teacher, then a student</h2>
          </div>
          <div>
            <p>
              The teacher is a heuristic pilot in <code>pilot/heuristics.py</code>. It
              estimates public damage clocks, keeps blockers back against a lethal
              counterattack, splits damage among multiple blockers, chooses affordable
              spells and keeps playable opening hands.
            </p>
            <p>
              The student learns combat only. It is a 44-feature linear softmax policy
              over complete combat proposals, first trained by behaviour cloning on 32
              teacher games, then updated with REINFORCE for four batches of 16 games.
              Hands and spell sequencing still come from the teacher.
            </p>
            <Plate
              figure="FIG. 1 · the teacher against two weak baselines"
              caption="From docs/experiments/starter-prototype.md. Win = 1, draw = 0.5, loss = 0. No draws, errors or truncations occurred."
            >
              <pre>
                <code>{RESULTS}</code>
              </pre>
            </Plate>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The evidence rules</div>
            <h2>Declare the test before you run it</h2>
            <p className="aside-note">
              <code>evaluation/statistics.py</code>, <code>evaluation/promotion.py</code>.
            </p>
          </div>
          <div>
            <p>
              Each experiment fixes its seeds, decks, opponents, game count and source
              files before any confirmation game. The bounds are Hoeffding intervals on
              the score, which are conservative: with 200 games and the alpha split across
              four strata, a perfect run gets a lower bound of 0.880 and not 1.0.
            </p>
            <p>
              The alpha budget is <code>0.05 / [k(k+1)]</code> for attempt{" "}
              <code>k</code>, and attempts are recorded in a SQLite ledger before the games
              start. A failed or interrupted run still uses its attempt, so I cannot retry
              until it looks good. Any technical failure in a game voids the run, and no
              game may be dropped. Passing the statistics is not enough either; the
              protocol also requires an independent review of rules behaviour and
              hidden-information separation.
            </p>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">What failed</div>
            <h2>The negative results</h2>
            <p className="aside-note">
              These are the numbers I would hide if I were selling it.
            </p>
          </div>
          <div>
            <Plate
              figure="FIG. 2 · the first learning run against the teacher"
              caption="304 games, no technical outcomes. Wins out of 16 per cell, pooled over two deck mirrors. Source: starter-prototype.md."
            >
              <pre>
                <code>{LEARNED}</code>
              </pre>
            </Plate>
            <ul>
              <li>
                <strong>RL won 4 of 16 against the teacher.</strong> Cloning alone won 3
                of 16. With 8 games per stratum even a perfect score only has a lower
                bound of 0.345, so the doc says RL is not shown to be better than
                cloning. The later guarded model won 45 of 64 against the teacher in a
                256-game paired comparison, but the paper trail says uncertainty
                still prevents a strength claim.
              </li>
              <li>
                <strong>The first brewing search found nothing.</strong> It played 280
                games over six legal deck mutations plus the original. The best,
                swapping a Pillarfield Ox for a Plains, scored 60.0% against 52.5% for
                the reference, but the simultaneous bounds on the difference were about
                -0.72 to +0.87. <code>confirmed_improvement</code> stayed false.
              </li>
              <li>
                <strong>A tactical gate failed.</strong> A fresh set of 48 board
                positions came back 42 of 48, 34 of 40 on the critical cases. Three new
                attack and block positions failed in both seats, and the 800-game
                confirmation I had planned was deferred. A corrective guard on combat
                then passed 48 of 48 new cases and the 800-game check (187/200 and
                180/200 against naive, 400/400 against random), but it carries no claim
                of beating the teacher.
              </li>
              <li>
                <strong>A tactical rewrite did not move scores.</strong> A 16-game
                comparison of a native XMage pilot with search over combat declarations
                scored the same as the original teacher against every opponent tested.
                It fixed specific positions, and it did not change a result.
              </li>
            </ul>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">The corpus</div>
            <h2>Real decks, partly collected</h2>
          </div>
          <div>
            <Features>
              <Feature label="Goldfish snapshot">
                All 135 Modern archetype pages were fetched and normalised into 143
                unique deck compositions. Of the 3,556 constituent deck URLs they list,
                3,555 are still queued and one was blocked with HTTP 403.
              </Feature>
              <Feature label="Provenance">
                Raw bytes are stored, requests respect robots.txt and wait two seconds
                apart, and a card name only resolves through an evidenced alias. Ten
                quarantined captures were recovered with three exact-name lookups.
              </Feature>
              <Feature label="Gaps">
                The Moxfield profile hit a Cloudflare block, YouTube discovery needs
                credentials I have not configured, and Spike discovery is incomplete.
              </Feature>
            </Features>
          </div>
        </section>

        <section className="section">
          <div>
            <div className="section-kicker">Where it stands</div>
            <h2>Full Modern is still ahead</h2>
            <p className="aside-note">
              Counts are from <code>docs/implementation-status.md</code>, observed 6 October 2026.
            </p>
          </div>
          <div>
            <p>
              The restricted starter engine is qualified, and so are two starter pilots,
              the heuristic and the guarded learned one. Nothing here shows a pilot
              that beats the teacher, an improved deck, or competence on Modern. The
              status document says so directly: no broadly qualified Modern engine, no
              confirmed strength advancement, no confirmed deck improvement, and no
              complete corpus.
            </p>
            <p>
              A separate XMage pilot also plays the starter pool plus Rebuke, which is
              the first instant-speed interaction in the project. It runs real XMage
              games, one of which lasted 108 turns. The tests are standard-library
              Python, 72 <code>test_*.py</code> files in <code>tests/</code>.
            </p>
            <OpenQuestion>
              Does any of this transfer? The 800-game gate says the pilot is competent
              against two weak baselines on a tiny pool. Whether the same approach
              works once there are instants, many colours and a sideboard is what the
              next engine work has to answer.
            </OpenQuestion>
          </div>
        </section>

        <section className="colophon">
          <div>
            Materials<strong>Python, XMage, Argentum, SQLite</strong>
          </div>
          <div>
            Vintage<strong>October 2026</strong>
          </div>
          <div>
            Status<strong>Active research, restricted pool</strong>
          </div>
          <div>
            Source<strong>private</strong>
          </div>
        </section>

      </main>
      <Folio slug="automatedspike" />
    </>
  );
}
