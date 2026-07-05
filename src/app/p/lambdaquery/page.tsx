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

export const metadata = {
  title: "LambdaQuery — Chong",
  description:
    "A compiler from Python comprehension-style queries to SQL — dependent-join decorrelation, empty-group semantics, and an adversarial DuckDB oracle that caught two real bugs.",
};

export default function LambdaQueryPage() {
  return (
    <>
      <PageBackground src="/bg/watercolor-2.jpg" />
      <RunningHead
        brand="Chong"
        meta={
          <>
            Entry II &nbsp;·&nbsp; LambdaQuery &nbsp;·&nbsp; filed under{" "}
            <span className="filed">compilers · semantics</span>
          </>
        }
      />

      <nav className="back-link">
        <Link href="/">← the notebook</Link>
      </nav>

      <section className="detail-hero">
        <div>
          <div className="kicker">№ 02 · Entry II</div>
          <h1>Python comprehensions, compiled to SQL.</h1>
          <p>
            Queries built as composable value objects — <code>fmap</code>,{" "}
            <code>filter</code>, <code>get_foreign</code> — run through a
            multi-pass compiler into standalone SQL. The interesting part is
            what it refuses to get wrong: a <code>count()</code> over an empty
            related set is <code>0</code>, exactly like <code>len([])</code>,
            never a silently vanished row.
          </p>
        </div>
        <Tags>
          <Tag>python</Tag>
          <Tag>~4.7k LoC</Tag>
          <Tag>150 tests</Tag>
          <Tag>MMXVII — rebuilt MMXXVI</Tag>
        </Tags>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ I — The idea</div>
          <h3>Say it once, in Python</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            For each school with at least one program: the average, over its
            departments, of the number of courses worth more than 3 credits.
          </p>
        </div>
        <div>
          <Plate
            figure="FIG. I — Three levels of correlation"
            caption="Fig. I — the count() > 0 filter compiles to an EXISTS semi-join; the nested aggregate becomes two grouped LEFT JOINs with COALESCE guarding the empty groups."
          >
            <div className="code-duet">
              <div className="code-panel">
                <h6>written</h6>
                <pre>
                  <code>{`School.query(
  lambda x: x.get_foreign('Program')
             .count() > 0
).fmap(
  lambda x:
    x.get_foreign('Department').fmap(
      lambda y:
        y.get_foreign('Course')
         .filter(lambda z: z.credits > 3)
         .count()
    ).avg() % x.name
)`}</code>
                </pre>
              </div>
              <div className="code-panel">
                <h6>compiled</h6>
                <pre>
                  <code>{`SELECT q2.avg_n, s.name
FROM School AS s
LEFT JOIN (
  SELECT AVG(COALESCE(q1.n, 0)) AS avg_n,
         d.school_code
  FROM Department AS d
  LEFT JOIN (
    SELECT COUNT(c.course_code) AS n,
           c.dept_code
    FROM Course AS c
    WHERE c.credits > 3
    GROUP BY c.dept_code
  ) AS q1 ON q1.dept_code = d.dept_code
  GROUP BY d.school_code
) AS q2 ON q2.school_code = s.school_code
WHERE EXISTS (
  SELECT 1 FROM Program AS p
  WHERE p.school_code = s.school_code)`}</code>
                </pre>
              </div>
            </div>
          </Plate>
          <p style={{ marginTop: 20 }}>
            An inner lambda can reference an outer lambda&rsquo;s row at any
            depth. The compiler handles it by <em>dependent-join
            unnesting</em>: the subquery gets a private copy of the outer
            table as its correlation domain, and successive passes pull the
            join conditions up until everything is flat. Aggregate subqueries
            are marked <code>LEFT JOIN</code> so an empty group still
            produces a row — that&rsquo;s where the Python semantics live.
          </p>
        </div>
      </section>

      <Divider>◆&nbsp;&nbsp;§ II&nbsp;&nbsp;◆</Divider>

      <section className="section">
        <div>
          <div className="section-kicker">§ II — The pipeline</div>
          <h3>Passes, to a fixpoint</h3>
        </div>
        <div>
          <ol>
            <li>
              <strong>Decorrelate.</strong> <code>internalize_correlated_tables</code>{" "}
              gives each inner scope its own copy of the outer tables it
              closes over; join conditions are pulled upward. Iterated to a
              fixpoint, because pulling one join condition up can expose the
              next.
            </li>
            <li>
              <strong>Flatten.</strong> Non-aggregate subqueries are merged
              into their parent. Aggregates are <em>refused</em> — flattening
              one would silently drop empty-group rows.
            </li>
            <li>
              <strong>Optimize, cost-only.</strong>{" "}
              <code>count() &gt; 0</code> rewrites to <code>EXISTS</code>;
              a <code>COALESCE</code> is elided when the surrounding predicate
              already rejects NULL the same way it rejects zero — which keeps
              the LEFT JOIN eligible for the engine&rsquo;s own join
              simplification. Every rewrite is result-preserving, and the test
              suite is the proof.
            </li>
          </ol>
          <p>
            One hard-won invariant, straight from a comment in{" "}
            <code>compile.py</code>: the passes track shared subqueries by
            object identity, so the pipeline must run in place on a single
            private deep copy — copy mid-pipeline and shared subqueries
            diverge into inconsistent twins with dangling aliases.
          </p>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ III — The oracle</div>
          <h3>Tested against two ground truths</h3>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 8 }}>
            A quarter of the codebase is the adversarial suite. Every compiled
            query is executed in DuckDB and diffed against a plain Python
            comprehension over the same in-memory data.
          </p>
        </div>
        <div>
          <p>
            The fixture data is built to hurt: a school with zero departments,
            a department with zero courses — the rows that vanish when
            correlated SQL is written by hand. One suite crosses every
            comparison operator with thresholds around the NULL/0 boundary,
            including reflected forms like <code>0 &lt; count(...)</code>.
            Another nests aggregates three deep with filters at every level.
          </p>
          <p>
            The harness caught two genuine compiler bugs, both documented in
            the suite rather than quietly fixed:
          </p>
          <ol>
            <li>
              <strong>Unparenthesized OR.</strong>{" "}
              <code>filter(A | B).filter(C)</code> emitted{" "}
              <code>x OR y AND z</code> — which SQL parses as{" "}
              <code>x OR (y AND z)</code>, silently changing which rows match.
              Survived every structural test; fell to the adversarial suite.
            </li>
            <li>
              <strong>Unscoped cross-scope joins.</strong> A reference to a
              non-key outer column joined against an <em>unconstrained</em>{" "}
              copy of the outer table — large, quiet over-counting. Pinned
              down with <code>xfail</code> regression tests that record the
              exact wrong numbers.
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div>
          <div className="section-kicker">§ IV — The rough edges</div>
          <h3>Open questions</h3>
        </div>
        <div>
          <OpenQuestion>
            The OR-precedence bug survived 148 structural tests and fell to
            the oracle in an afternoon. What is the smallest differential
            harness that would have caught it on day one — and is it small
            enough to write <em>before</em> the compiler?
          </OpenQuestion>
          <OpenQuestion label="Open question II">
            Child-to-parent traversal (many-to-one <code>get_foreign</code>)
            and <code>Query.bind</code> are unimplemented. Do they fall out of
            the same decorrelation machinery, or is the value-object encoding
            hiding a monad that wants to exist?
          </OpenQuestion>
        </div>
      </section>

      <section className="colophon">
        <div>
          Materials<strong>Python, DuckDB, networkx</strong>
        </div>
        <div>
          Vintage<strong>MMXVII — rebuilt MMXXVI</strong>
        </div>
        <div>
          Scale<strong>4.7k LoC · 150 tests · 2 bugs, documented</strong>
        </div>
        <div>
          Source
          <strong>
            <a href="https://github.com/xnmp/LambdaQuery_2">
              github/xnmp/LambdaQuery_2
            </a>
          </strong>
        </div>
      </section>

      <Folio number="2" />
    </>
  );
}
