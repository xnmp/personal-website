import Link from "next/link";
import Image from "next/image";
import {
  RunningHead,
  Divider,
  Entry,
  EntryLabel,
  EntryHeading,
  Tags,
  Tag,
  OpenQuestion,
  MarginNote,
  Plate,
  Features,
  Feature,
  Folio,
  PageBackground,
} from "@/components/notebook";
import { TauriSchematic } from "@/components/demos/TauriSchematic";
import { EskivQ3 } from "@/components/charts/EskivQ3";
import { ZsyLadder } from "@/components/charts/ZsyLadder";
import { BwaiBench } from "@/components/charts/BwaiBench";

export default function Home() {
  return (
    <>
      <PageBackground src="/bg/watercolor-1.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entries I–VI &nbsp;·&nbsp; MMXXVI — ongoing &nbsp;·&nbsp; filed
            under <span className="filed">passions</span>
          </>
        }
      />

      <section className="hero">
        <div>
          <h1 className="title">
            A notebook
            <br />
            of <em>small things</em>.
          </h1>
          <p className="lede">
            A running record of the tools, games, and small studies I keep
            returning to. Some are finished, some never will be, and a few are{" "}
            <b>still producing new observations</b>.
          </p>
          <div className="byline">
            <a href="https://github.com/xnmp">github/xnmp</a> &nbsp;·&nbsp;{" "}
            <a href="mailto:chonw@proton.me">chonw@proton.me</a>
          </div>
        </div>
        <MarginNote label="Marginalia">
          Each entry is a project or an open question. Plates are sketched from
          life; citations live in the footer. Press <code>/</code> for the
          index, <code>t</code> for the desk lamp. Take what&rsquo;s useful;
          argue with the rest.
        </MarginNote>
      </section>

      <Divider>◆&nbsp;&nbsp;Entry I&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 01" title="Tauri Explorer" />
            <Link href="/p/tauri-explorer" className="entry-link">
              <EntryHeading>
                A file manager with the soul of an IDE.
              </EntryHeading>
            </Link>
            <p>
              <code>Ctrl+P</code> for frecency fuzzy-find.{" "}
              <code>Ctrl+Shift+F</code> for ripgrep across the tree. A command
              palette that surfaces every action. Minimal by default —
              everything else is a shortcut away.
            </p>
            <Tags>
              <Tag>rust</Tag>
              <Tag>tauri v2</Tag>
              <Tag>svelte 5</Tag>
              <Tag>1,632 commits</Tag>
            </Tags>
            <OpenQuestion>
              Should frecency decay differently per file type — faster for
              downloads, slower for source?
            </OpenQuestion>
            <Link href="/p/tauri-explorer" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <Link href="/p/tauri-explorer" className="entry-link">
            <Plate
              figure="FIG. I — Chromeless by default"
              caption="Fig. I — dual-pane navigation, command palette floated over an active selection."
            >
              <TauriSchematic />
            </Plate>
            <Features>
              <Feature label="Ctrl+P quick open">
                Fuzzy search the tree, ranked by frecency.
              </Feature>
              <Feature label="Perf baseline in CI">
                30 benchmarks tracked per commit. Sorting 10k entries: 9.95ms.
              </Feature>
              <Feature label="Replaces the OS picker">
                Ships an xdg-desktop-portal backend — other apps&rsquo; file
                dialogs open <em>this</em>.
              </Feature>
              <Feature label="Tested three ways">
                88 unit files, 68 browser e2e specs, 9 against the real
                filesystem.
              </Feature>
            </Features>
          </Link>
        }
      />

      <Divider>◆&nbsp;&nbsp;Entry II&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 02" title="LambdaQuery" />
            <Link href="/p/lambdaquery" className="entry-link">
              <EntryHeading>
                Python comprehensions, compiled to SQL.
              </EntryHeading>
            </Link>
            <p>
              Write the query as composable Python; get decorrelated,
              outer-join-preserving SQL that keeps <code>len([]) == 0</code>{" "}
              semantics — the exact case hand-written SQL gets wrong. Every
              compiled query is checked against DuckDB <em>and</em> a plain
              Python interpreter of the same expression.
            </p>
            <Tags>
              <Tag>python</Tag>
              <Tag>compiler</Tag>
              <Tag>150 tests</Tag>
              <Tag>duckdb oracle</Tag>
            </Tags>
            <OpenQuestion>
              The OR-precedence bug survived every structural test and fell to
              the adversarial suite in one afternoon. What&rsquo;s the smallest
              oracle that would have caught it on day one?
            </OpenQuestion>
            <Link href="/p/lambdaquery" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <Link href="/p/lambdaquery" className="entry-link">
            <Plate
              figure="FIG. IV — One expression, two evaluators"
              caption="Fig. IV — a correlated count compiles to a grouped LEFT JOIN; the optimizer notices > 5 already rejects NULL and elides the COALESCE."
            >
              <div className="code-duet">
                <div className="code-panel">
                  <h6>written</h6>
                  <pre>
                    <code>{`School.query(
  lambda x:
    x.get_foreign('Department')
     .count() > 5
)`}</code>
                  </pre>
                </div>
                <div className="code-panel">
                  <h6>compiled</h6>
                  <pre>
                    <code>{`SELECT ... FROM School AS s
LEFT JOIN (
  SELECT COUNT(d.dept_code) AS n,
         d.school_code
  FROM Department AS d
  GROUP BY d.school_code
) AS q ON q.school_code = s.school_code
WHERE q.n > 5`}</code>
                  </pre>
                </div>
              </div>
            </Plate>
            <Features>
              <Feature label="Dependent joins">
                Correlated aggregates at any nesting depth, decorrelated
                mechanically.
              </Feature>
              <Feature label="Empty groups count as 0">
                LEFT JOIN + COALESCE preserves Python&rsquo;s{" "}
                <code>sum([]) == 0</code>.
              </Feature>
              <Feature label="EXISTS rewriting">
                <code>count() &gt; 0</code> becomes a semi-join, not a grouped
                scan.
              </Feature>
              <Feature label="2 real bugs caught">
                The adversarial suite found and documented both. A quarter of
                the codebase is tests.
              </Feature>
            </Features>
          </Link>
        }
      />

      <Divider>◆&nbsp;&nbsp;Entry III&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 03" title="Zheng Shang You" />
            <Link href="/p/zheng-shang-you" className="entry-link">
              <EntryHeading>
                Teaching a network the family card game.
              </EntryHeading>
            </Link>
            <p>
              Pure self-play produced literally zero gradient signal. What
              worked: behaviour cloning from a scripted strategist, PPO with a
              perfect-information critic, a generational league, and a
              determinized search whose single biggest lever was fixing its{" "}
              <em>variance</em>, not its depth.
            </p>
            <Tags>
              <Tag>pytorch</Tag>
              <Tag>self-play league</Tag>
              <Tag>rust engine ×14</Tag>
            </Tags>
            <OpenQuestion>
              Gen-3 is flat against a same-class anchor. Is the 512×4 policy
              class saturated — or has the league stopped pointing the gradient
              anywhere?
            </OpenQuestion>
            <Link href="/p/zheng-shang-you" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <>
            <Plate
              figure="FIG. VI — The recipe, step by step"
              caption="Fig. VI — win rate in a 4-player ring vs three scripted strategists; ¼ is seat parity. Each step is one fix, dated in the training log."
            >
              <ZsyLadder />
            </Plate>
            <Features>
              <Feature label="0.471 win rate">
                vs 3× scripted strategist over 1,000 seat-rotated games.
                Parity is 0.25.
              </Feature>
              <Feature label="Zero-signal self-play">
                Symmetric multiplayer self-play: every network scores ~33%.
                Documented, dated, abandoned.
              </Feature>
              <Feature label="Rank-graded rollouts">
                Win/loss rollouts at D=6: no lift. Rank-graded at D=32: +10
                points.
              </Feature>
              <Feature label="14× via Rust">
                Whole workloads batched into a PyO3 engine: 0.15ms per game.
              </Feature>
            </Features>
          </>
        }
      />

      <Divider>◆&nbsp;&nbsp;Entry IV&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 04" title="Tableau Frog" />
            <Link href="/p/tableau-frog" className="entry-link">
              <EntryHeading>
                Point at a difference; it tells you if it&rsquo;s real.
              </EntryHeading>
            </Link>
            <p>
              Select any subset of your data and every other panel recolors to
              show enrichment against the population — with a two-proportion
              z-test and FDR correction deciding what deserves color at all.
              Charts are inferred from variables, never picked from a menu.
            </p>
            <Tags>
              <Tag>svelte 5</Tag>
              <Tag>statistics</Tag>
              <Tag>from-scratch ML</Tag>
              <Tag>1M rows &lt; 100ms</Tag>
            </Tags>
            <OpenQuestion>
              When the lens greys out non-significant differences, do people
              stop looking — or finally start trusting the ones that stay lit?
            </OpenQuestion>
            <Link href="/p/tableau-frog" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <Link href="/p/tableau-frog" className="entry-link">
            <Plate
              figure="FIG. VIII — The contrast lens"
              caption="Fig. VIII — AI Investigate turns a brushed selection into falsifiable hypothesis cards; only shape metadata ever leaves the machine."
            >
              <Image
                src="/tableau-frog/investigate-cards.webp"
                alt="Tableau Frog's Investigate mode showing hypothesis cards generated from a data selection"
                width={1280}
                height={800}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Plate>
            <Features>
              <Feature label="Significance-aware">
                z-test + Benjamini–Hochberg. Non-significant enrichment is
                greyed, not colored.
              </Feature>
              <Feature label="Own random forest">
                Deterministic, zero-dep, with permutation importance and
                partial dependence.
              </Feature>
              <Feature label="Falsifiable AI">
                Investigate mode emits hypothesis cards with one-click test
                projections and a verdict trail.
              </Feature>
              <Feature label="Domain-first">
                27 pure-TS modules; the Rust shell only opens files.
              </Feature>
            </Features>
          </Link>
        }
      />

      <Divider>◆&nbsp;&nbsp;Entry V&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 05" title="Eskiv" />
            <Link href="/p/eskiv" className="entry-link">
              <EntryHeading>
                A brute-force AI that plays a dodger.
              </EntryHeading>
            </Link>
            <p>
              2016 game, 2026 analysis. Ten thousand games of the brute-force
              agent with <code>lookahead=100</code>. Three plates: how
              straight it walks, where it stands, and how it dies (trapped,
              never hit).
            </p>
            <Tags>
              <Tag>python</Tag>
              <Tag>pygame</Tag>
              <Tag>brute-force</Tag>
              <Tag>10,000 games</Tag>
            </Tags>
            <OpenQuestion>
              If the agent never gets hit in 10,000 games, it&rsquo;s
              over-spending lookahead on safety. What&rsquo;s the smallest
              horizon that preserves <code>n_hit=0</code>?
            </OpenQuestion>
            <Link href="/p/eskiv" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <>
            <Plate
              figure="FIG. XI — Final score across 10,000 games"
              caption="Mean 381 · median 385 · stddev 58. Every death was a trap; zero direct hits."
            >
              <EskivQ3 />
            </Plate>
            <Features>
              <Feature label="lookahead = 100">
                Brute-force search accepts only moves with a safe 100-step
                future.
              </Feature>
              <Feature label="n_hit = 0">
                Not a single game ended by getting clipped. Every death was
                a trap.
              </Feature>
              <Feature label="corner drift">
                By score 500 the agent lives against a wall — emergent, not
                programmed.
              </Feature>
              <Feature label="16.4M steps">
                Every frame of every game saved. Engine is ~5× faster
                headless.
              </Feature>
            </Features>
          </>
        }
      />

      <Divider>◆&nbsp;&nbsp;Entry VI&nbsp;&nbsp;◆</Divider>

      <Entry
        left={
          <>
            <EntryLabel number="№ 06" title="Brood War" />
            <Link href="/p/bwai" className="entry-link">
              <EntryHeading>
                The game that taught me to think, revisited as a problem.
              </EntryHeading>
            </Link>
            <p>
              I used to play this competitively. Before writing any training
              code, this project audited whether an AlphaStar-for-Brood-War is
              even feasible — then followed its own report&rsquo;s first
              recommendation: benchmark the unglamorous thing. The engine does
              40,000 frames a second. The bottleneck will be everything else.
            </p>
            <Tags>
              <Tag>starcraft</Tag>
              <Tag>openbw</Tag>
              <Tag>c++ / pybind11</Tag>
              <Tag>behaviour cloning</Tag>
            </Tags>
            <OpenQuestion>
              The corpus is 6,770 PvP replays — twenty times smaller than
              AlphaStar&rsquo;s. Where does imitation stop and the league have
              to begin?
            </OpenQuestion>
            <Link href="/p/bwai" className="read-more">
              read the full entry →
            </Link>
          </>
        }
        right={
          <>
            <Plate
              figure="FIG. XIII — Engine throughput, measured first"
              caption="Fig. XIII — aggregate OpenBW frames/sec by parallel instance count on a 12-core desktop. Stage 0 of 6: de-risk the substrate."
            >
              <BwaiBench />
            </Plate>
            <Features>
              <Feature label="Feasibility first">
                A sourced audit of the AlphaStar literature before any code —
                verified claims, refuted ones, compute-cost tiers.
              </Feature>
              <Feature label="92.7% label coverage">
                A hand-built inverse labeler recovers macro-actions from pro
                replay command streams.
              </Feature>
              <Feature label="Own C++ bridge">
                TorchCraft died in 2022, so the replay/game interface is
                rebuilt from scratch in pybind11.
              </Feature>
              <Feature label="Signal confirmed">
                A 1.76M-param toy model overfits the pipeline to 98% — the
                labels carry signal.
              </Feature>
            </Features>
          </>
        }
      />

      <Folio number="vi" />
    </>
  );
}
