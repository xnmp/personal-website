---
slug: lambdaquery
glyph: 查
title: LambdaQuery
summary: "An old project for writing SQL queries as Python expressions, revisited."
heading: "An old query compiler, revisited"
href: /p/lambdaquery
repo: 'https://github.com/xnmp/LambdaQuery_2'
tags:
  - python
  - compiler
  - sql
  - semantics
index: "Python-to-SQL compiler · started in 2017, revisited in 2026"
stats:
  - "Python → SQL"
  - "Nested queries"
  - "DuckDB comparisons"
art: /screens/lambdaquery.png
status: producing
shelf: tools
tone: amber
metadata:
  title: "LambdaQuery · chong"
  description: "Revisiting a Python-to-SQL query compiler, including the awkward cases where empty groups and nested queries change the answer."
order: 6
---

<!-- block: 4 -->
Python → SQL

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
An old query compiler, revisited

<!-- block: queries-built-as-composable-value-objects-fmap-filter-get -->
This goes back to 2017, and I've been revisiting it in 2026. The idea is to build a query out of Python expressions and have a compiler turn it into SQL.

The awkward part is keeping the meaning the same. If I count an empty list in Python I get zero. A SQL join can make that whole row disappear instead. A lot of the work here is in details like that.

<!-- block: python -->
python

<!-- block: 150-tests -->
150 tests

<!-- block: 2017-rebuilt-2026 -->
2017, rebuilt 2026

<!-- block: the-idea -->
An example

<!-- block: say-it-once-in-python -->
What I want to ask the database

<!-- block: for-each-school-with-at-least-one-program-the-average-over -->
For each school with at least one program, find the average number of courses worth more than three credits across its departments. Here's what that looks like in the query API and in the generated SQL.

<!-- block: figure-fig-1-three-levels-of-correlation -->
FIG. 1 · Three levels of correlation

<!-- block: caption-fig-1-the-count-0-filter-compiles-to-an-exists-sem -->
The EXISTS checks for a program. LEFT JOIN and COALESCE keep a department with no matching courses in the calculation, with a count of zero.

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
The nested lambdas can refer to outer rows. The compiler has to turn those references into joins while keeping the empty groups. That ends up being more involved than translating each method call into a SQL keyword.

<!-- block: the-pipeline -->
Underneath

<!-- block: passes-to-a-fixpoint -->
Untangling the nested queries

<!-- block: body-untangling-the-nested-queries -->
1. **Outer references.** Give an inner scope its own correlation domain, then pull the join conditions upwards. One pass can expose another reference, so this repeats until nothing changes.
2. **Flattening.** Merge subqueries where that's safe. Aggregates need more care, because flattening them can lose rows for empty groups.
3. **Simplifying.** A condition like `count() > 0` can become EXISTS. These rewrites are intended to keep the result the same; comparing actual query outputs is how I check that.

One implementation detail that matters more than it first appears: shared subqueries are tracked by object identity. The passes work on one private copy. Copying again halfway through can give two different versions of what was meant to be the same subquery.

<!-- block: the-oracle -->
Checking the answers

<!-- block: tested-against-two-ground-truths -->
Running the same question in Python and SQL

<!-- block: a-quarter-of-the-codebase-is-the-adversarial-suite -->
The useful check is to run the generated SQL in DuckDB and compare it with a plain Python comprehension over the same data.

<!-- block: body-running-the-same-question-in-python-and-sql -->
The examples include schools with no departments and departments with no courses. Those are easy to overlook when a query looks right on a more convenient dataset.

Two bugs that this caught:

1. **OR precedence.** `filter(A | B).filter(C)` generated `x OR y AND z`. Without parentheses, SQL answers a different question. Checking the generated query's shape hadn't caught it.
2. **Outer references.** One non-key reference joined against an unconstrained copy of the outer table and quietly over-counted. Comparing the result with Python made the mistake visible.

<!-- block: the-rough-edges -->
Unfinished bits

<!-- block: open-questions -->
What I'd work on next

<!-- block: body-what-id-work-on-next -->
### Open question

I'd start the result-comparison checks much earlier if I were doing it again. They caught mistakes that plenty of tests of the query structure had missed.

### Open question II

Child-to-parent traversal and `Query.bind` aren't implemented. There's also a limitation where filtering after `fmap` discards the projection, so this is still a project to work on rather than a finished query library.

<!-- block: materialspython-duckdb-networkx -->
Materials**Python, DuckDB, networkx**

<!-- block: vintage2017-rebuilt-2026 -->
Vintage**2017, rebuilt 2026**

<!-- block: scale4 -->
Notes**Nested queries, empty groups and result comparisons**

<!-- block: source-github-xnmp-lambdaquery-2-https-github -->
Source **[github/xnmp/LambdaQuery_2 ](https://github.com/xnmp/LambdaQuery_2)**
