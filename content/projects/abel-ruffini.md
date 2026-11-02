---
slug: abel-ruffini
glyph: σ
title: Abel–Ruffini
summary: "Trying to understand why solving equations turns into a question about permutations."
heading: "Why do formulas run out at degree five?"
href: /p/abel-ruffini
tags:
  - mathematics
  - Galois theory
  - worked notes
index: "Abel Ruffini · quintic · polynomial solvability · symmetry · radicals"
stats:
  - "7 worked notes"
  - "Quadratic → quintic"
art: /screens/abel-ruffini.svg
status: producing
shelf: tools
tone: amber
order: 13
metadata:
  title: "Abel–Ruffini · chong"
  description: "Working from the quadratic formula towards the obstruction at degree five, with symmetry doing the explaining."
---
<!-- block: all-projects -->
← all projects

<!-- block: headline -->
Why do formulas run out at degree five?

<!-- block: intro -->
The question I was trying to get straight was how completing the square turns into a problem about permutations. I'd done some group theory, but being told “the Galois group isn't solvable” wasn't really an explanation of why groups had entered the picture in the first place.

So I worked through it with Claude, starting with a deliberately small question: can the symmetry of two roots tell us why a square root belongs in the quadratic formula? These are edited notes from that conversation. The bit I keep coming back to is that the algebra starts to feel forced, rather than like a collection of clever substitutions somebody happened to find.

<!-- block: starting-heading -->
Start with one swap

<!-- block: starting -->
Suppose the roots of $x^2+bx+c$ are $r_1,r_2$. Split one root into two pieces:

$$
r_1=\frac{r_1+r_2}{2}+\frac{r_1-r_2}{2}.
$$

Swapping the roots leaves the first piece alone and negates the second. The first piece is already known from the coefficients. The second isn't, but its square is unchanged by the swap, so its square is known too. One square root recovers the missing piece.

That's the connection I wanted to see before bringing in any machinery: the swap suggests the split, and the split suggests the radical. The [quadratic note](/p/abel-ruffini/notes/quadratic) fills in the calculation.

<!-- block: recursion-heading -->
Then ask the same question again

<!-- block: recursion -->
For three roots, the corresponding split uses cube roots of unity. Cubing the new pieces removes the cyclic ambiguity, but doesn't remove the swaps. The quantities we still need turn out to be the roots of a quadratic. So we use the previous argument on those, then come back and take the cube root.

The quartic adds a wrinkle: two commuting swaps can be handled together. Their squared pieces are shuffled like three roots, which gives a cubic to solve first. The notes spend time on that wrinkle because “the same trick again” was hiding something I hadn't understood.

There are two orders here. We discover what we need by working backwards from a root. We calculate it by following those dependencies forwards. Keeping those separate made the recursion much easier for me to follow.

<!-- block: obstruction-heading -->
What actually stops at five

<!-- block: obstruction -->
For the general polynomial, the group of possible root relabellings starts as $S_n$. The successful radical constructions correspond to chains of subgroups, each normal in the previous one, with cyclic quotients. It is the **quotients** that must be cyclic; the subgroups themselves needn't be.

For a cubic, the chain is $S_3\supset A_3\supset\{1\}$. For a quartic, we can use $S_4\supset A_4\supset V_4\supset C_2\supset\{1\}$.

For the general quintic, $S_5\supset A_5$ is a valid first step. Then we're stuck: $A_5$ is simple and nonabelian, so it has no further proper normal step with an abelian quotient.

That explains where the construction runs out. Proving that *every possible radical formula* faces the same obstruction needs Galois theory, including the possibility that intermediate radicals leave the original splitting field. That's what the [last note](/p/abel-ruffini/notes/galois) is for.

This is about a general formula using arithmetic and radicals. Particular quintics can be solvable: $x^5-2=0$ is one. Numerical approximation is a different question altogether.

<!-- block: notes-heading -->
The longer conversation

<!-- block: notes-intro -->
I've kept the questions that made me stop and ask for another explanation. These chapters follow the seven saved notes, with some of the informal claims tightened up. They assume characteristic zero; when using roots of unity as fixed scalars, those constants are included in the base field.

<!-- block: references -->
The route through the subject comes from my polynomial-solvability notes and Claude conversation. For the formal solvability criterion, see J. S. Milne's [*Fields and Galois Theory*](https://www.jmilne.org/math/Books/FT0.pdf#page=64), Theorem 3.28 and the later proof in Section 5. These are working explanations I'm still editing, rather than a replacement for that treatment.
