---
slug: lambdaquery
glyph: 查
title: LambdaQuery
summary: Python comprehensions, compiled to SQL.
heading: 'Python comprehensions, compiled to SQL.'
href: /p/lambdaquery
repo: 'https://github.com/xnmp/LambdaQuery_2'
tags:
  - python
  - compiler
  - sql
  - semantics
index: 'A query compiler · dependent joins, correlated aggregates'
stats:
  - 150 tests
  - 2 bugs caught
  - 4.7k loc
art: /screens/lambdaquery.png
status: producing
shelf: tools
tone: amber
metadata:
  title: 'LambdaQuery: Python comprehensions, compiled to SQL'
  description: >-
    A compiler from Python comprehension-style queries to SQL: dependent-join
    decorrelation, empty-group semantics, and an adversarial DuckDB oracle that
    caught two real bugs.
order: 6
---
<!-- block: 4 -->
~4.7k LoC

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
Python compre&shy;hensions, compiled to SQL.

<!-- block: queries-built-as-composable-value-objects-fmap-filter-get -->
Queries built as composable value objects (`fmap`, `filter`, `get_foreign`) run through a multi-pass compiler into standalone SQL. The interesting part is what it refuses to get wrong. A `count()` over an empty related set is `0`, exactly like `len([])`, and the row never silently vanishes.

<!-- block: python -->
python

<!-- block: 150-tests -->
150 tests

<!-- block: 2017-rebuilt-2026 -->
2017, rebuilt 2026

<!-- block: the-idea -->
The idea

<!-- block: say-it-once-in-python -->
Say it once, in Python

<!-- block: for-each-school-with-at-least-one-program-the-average-over -->
For each school with at least one program: the average, over its departments, of the number of courses worth more than 3 credits.

<!-- block: figure-fig-1-three-levels-of-correlation -->
FIG. 1 · Three levels of correlation

<!-- block: caption-fig-1-the-count-0-filter-compiles-to-an-exists-sem -->
Fig. 1: the count() > 0 filter compiles to an EXISTS semi-join; the nested aggregate becomes two grouped LEFT JOINs with COALESCE guarding the empty groups.

<!-- block: written -->
written

<!-- block: code-school-query-lambda-x-x-get-foreign-program-count-0-f -->
```
School.query(
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
)
```

<!-- block: compiled -->
compiled

<!-- block: code-select-q2-avg-n-s-name-from-school-as-s-left-join-sel -->
```
SELECT q2.avg_n, s.name
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
  WHERE p.school_code = s.school_code)
```

<!-- block: an-inner-lambda-can-reference-an-outer-lambda-s-row-at-any -->
An inner lambda can reference an outer lambda’s row at any depth. The compiler handles it by *dependent-join unnesting*: the subquery gets a private copy of the outer table as its correlation domain, and successive passes pull the join conditions up until everything is flat. Aggregate subqueries are marked `LEFT JOIN` so an empty group still produces a row, and that is where the Python semantics live.

<!-- block: the-pipeline -->
The pipeline

<!-- block: passes-to-a-fixpoint -->
Passes, to a fixpoint

<!-- block: decorrelate -->
**Decorrelate.** `internalize_correlated_tables` gives each inner scope its own copy of the outer tables it closes over; join conditions are pulled upward. Iterated to a fixpoint, because pulling one join condition up can expose the next.

<!-- block: flatten -->
**Flatten.** Non-aggregate subqueries are merged into their parent. Aggregates are *refused*, because flattening one would silently drop empty-group rows.

<!-- block: optimize-cost-only -->
**Optimize, cost-only.** `count() > 0` rewrites to `EXISTS`; a `COALESCE` is elided when the surrounding predicate already rejects NULL the same way it rejects zero, which keeps the LEFT JOIN eligible for the engine’s own join simplification. Every rewrite is result-preserving, and the test suite is the proof.

<!-- block: one-hard-won-invariant-straight-from-a-comment-in-compile -->
One hard-won invariant, straight from a comment in `compile.py`: the passes track shared subqueries by object identity, so the pipeline must run in place on a single private deep copy. Copy mid-pipeline and shared subqueries diverge into inconsistent twins with dangling aliases.

<!-- block: the-oracle -->
The oracle

<!-- block: tested-against-two-ground-truths -->
Tested against two ground truths

<!-- block: a-quarter-of-the-codebase-is-the-adversarial-suite -->
A quarter of the codebase is the adversarial suite. Every compiled query is executed in DuckDB and diffed against a plain Python comprehension over the same in-memory data.

<!-- block: the-fixture-data-is-built-to-hurt-a-school-with-zero-depar -->
The fixture data is built to hurt: a school with zero departments, a department with zero courses, the rows that vanish when correlated SQL is written by hand. One suite crosses every comparison operator with thresholds around the NULL/0 boundary, including reflected forms like `0 < count(...)`. Another nests aggregates three deep with filters at every level.

<!-- block: the-harness-caught-two-genuine-compiler-bugs-both-document -->
The harness caught two genuine compiler bugs, both documented in the suite rather than quietly fixed:

<!-- block: unparenthesized-or -->
**Unparenthesized OR.** `filter(A | B).filter(C)` emitted `x OR y AND z`, which SQL parses as `x OR (y AND z)`, silently changing which rows match. Survived every structural test; fell to the adversarial suite.

<!-- block: unscoped-cross-scope-joins -->
**Unscoped cross-scope joins.** A reference to a non-key outer column joined against an *unconstrained* copy of the outer table, giving large, quiet over-counting. Pinned down with `xfail` regression tests that record the exact wrong numbers.

<!-- block: the-rough-edges -->
The rough edges

<!-- block: open-questions -->
Open questions

<!-- block: the-or-precedence-bug-survived-148-structural-tests-and-fe -->
The OR-precedence bug survived 148 structural tests and fell to the oracle in an afternoon. What is the smallest differential harness that would have caught it on day one, and is it small enough to write *before* the compiler?

<!-- block: child-to-parent-traversal-many-to-one-get-foreign-and-quer -->
Child-to-parent traversal (many-to-one `get_foreign`) and `Query.bind` are unimplemented. Do they fall out of the same decorrelation machinery, or is the value-object encoding hiding a monad that wants to exist?

<!-- block: label-open-question-ii -->
Open question II

<!-- block: materialspython-duckdb-networkx -->
Materials**Python, DuckDB, networkx**

<!-- block: vintage2017-rebuilt-2026 -->
Vintage**2017, rebuilt 2026**

<!-- block: scale4 -->
Scale**4.7k LoC · 150 tests · 2 bugs, documented**

<!-- block: source-github-xnmp-lambdaquery-2-https-github -->
Source **[github/xnmp/LambdaQuery_2 ](https://github.com/xnmp/LambdaQuery_2)**
