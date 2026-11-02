---
title: Abel–Ruffini · worked notes
chapters:
  - id: quadratic
    title: "The quadratic: what a swap forces"
    summary: "Split a root into the part a swap leaves alone and the part it negates."
  - id: cubic
    title: "The cubic: a three-way split"
    summary: "The same averaging recipe, now weighted by cube roots of unity."
  - id: cubic-recursion
    title: "The cubic, in two different orders"
    summary: "Why we discover the cube root first but calculate the square root first."
  - id: quartic
    title: "The quartic: why a cubic appears"
    summary: "Three squared pieces, shuffled by the permutations of four roots."
  - id: commuting-swaps
    title: "What the commuting swaps are doing"
    summary: "Work out the simultaneous decomposition instead of calling it the same trick."
  - id: shape
    title: "The shape of a radical formula"
    summary: "Normal subgroups, cyclic quotients, and the obstruction at degree five."
  - id: galois
    title: "What Galois theory adds"
    summary: "The dictionary between knowing more numbers and having fewer invisible permutations."
---
<!-- block: quadratic -->
The question I started with was whether symmetry can tell us the *form* of the quadratic formula before we do the calculation. Why a square root, rather than some clever substitution that happens to work?

## What the coefficients know

For the monic quadratic

$$
(x-r_1)(x-r_2)=x^2+bx+c,
$$

we know $r_1+r_2=-b$ and $r_1r_2=c$. Neither coefficient distinguishes the first root from the second. Swapping their labels leaves everything we're given unchanged.

For generic roots, every symmetric rational expression in them is a rational function of those coefficients. “Generic” matters here: the coefficients are independent symbols, not particular numbers that might satisfy extra relations. Work in characteristic zero, and include the constant roots of unity we use in the base field.

So a symmetric expression is already available using arithmetic. The interesting part of a root must be the part that isn't symmetric.

## Split before introducing eigenvalues

Write

$$
r_1=A+d,\qquad
A=\frac{r_1+r_2}{2},\qquad d=\frac{r_1-r_2}{2}.
$$

The swap fixes $A$ and sends $d$ to $-d$. That's all “symmetric and antisymmetric parts” means here. Calling them eigenpieces comes afterwards: the swap multiplies them by $+1$ and $-1$.

The symmetric half is known:

$$
A=-\frac b2.
$$

The antisymmetric half isn't known, but its square is symmetric, since $(-d)^2=d^2$. Calculate that square from the known sum and product:

$$
d^2=\frac{(r_1+r_2)^2-4r_1r_2}{4}=\frac{b^2}{4}-c.
$$

One square root recovers $d$, and therefore

$$
r_{1,2}=-\frac b2\pm\sqrt{\frac{b^2}{4}-c}.
$$

The swap suggested the split; squaring removed its sign change. The rest really was filling in the calculation.

## What this does and doesn't force

This identifies a natural quadratic extension and the useful square root, up to multiplication by a known nonzero factor. It doesn't force one literal way of writing a formula. We can always write a needlessly complicated expression for the same number.

And constructing this formula is easier than proving that no radical formula exists for some other equation. A hypothetical formula could introduce intermediate numbers outside the original field of roots. We will need the full Galois-theoretic criterion to rule those out too.

<!-- block: cubic -->
The next question in the conversation was whether the two-way split generalises to a linear combination weighted by third roots of unity. It does. The new difficulty is that being unchanged by a cycle no longer means being unchanged by every permutation.

## The averaging recipe

Shift a cubic to $z^3+pz+q$, with roots $r_1+r_2+r_3=0$. Let $\tau$ cycle them:

$$
\tau:r_1\mapsto r_2\mapsto r_3\mapsto r_1.
$$

Put $\omega=e^{2\pi i/3}$. We include $\omega$ among the fixed constants; the permutation relabels roots, not this constant. Since $\tau^3=1$, its scalar multipliers are $1,\omega,\omega^2$.

For a multiplier $\lambda$, the corresponding piece of a quantity $h$ is

$$
\frac{h+\lambda^{-1}\tau(h)+\lambda^{-2}\tau^2(h)}{3}.
$$

Apply that recipe to $r_1$:

$$
e_0=\frac{r_1+r_2+r_3}{3}=0,
\qquad u=\frac{r_1+\omega^2r_2+\omega r_3}{3},
\qquad v=\frac{r_1+\omega r_2+\omega^2r_3}{3}.
$$

Then $\tau(u)=\omega u$, $\tau(v)=\omega^2v$, and $r_1=u+v$. This is Cardano's substitution appearing as a decomposition, rather than being guessed.

## Cubing isn't enough

Cubing removes the multipliers, so $u^3,v^3$ are fixed by the three-cycle. But swapping $r_2,r_3$ swaps $u,v$, hence swaps their cubes. Those cubes aren't symmetric in all three roots.

Their sum and product are:

$$
u^3+v^3=-q,\qquad u^3v^3=-\frac{p^3}{27}.
$$

So the two numbers we need are roots of a quadratic. Split them into a symmetric and an antisymmetric half, just as before:

$$
u^3=-\frac q2+D,\qquad
v^3=-\frac q2-D,\qquad
D^2=\frac{q^2}{4}+\frac{p^3}{27}.
$$

A square root gives $D$; a cube root then gives $u$. The other piece must satisfy $uv=-p/3$. In particular, **don't choose the two complex cube roots independently**: uncoordinated principal branches needn't add to a root of the cubic.

For $u\ne0$, take $v=-p/(3u)$. If a specialised cubic makes $u=0$, then $p=0$; choose the opposite sign of $D$ when $q\ne0$, or handle $p=q=0$ directly. The generic calculation doesn't excuse dividing by zero in a numerical example.

## Why not split against every permutation at once?

A nonabelian group can have quantities that every element scales. The product of root differences, for instance, changes by the sign of a permutation.

What fails is decomposing the generic root *entirely* into such scalar pieces. Commutators act trivially on every simultaneous scalar piece. For $S_3$, those commutators generate $A_3$, which still moves the roots. So the root can't be recovered solely from pieces scaled by all of $S_3$.

Instead we resolve two cyclic quotients in succession: $S_3/A_3$, then $A_3/\{1\}$.

<!-- block: cubic-recursion -->
This was where I got turned around. If we first found $u$ and $v$, why did the next explanation start with the square root? There are two different orders: discovering what we need, and actually calculating it.

## Discovery goes backwards from the root

1. We want $r_1=u+v$.
2. To obtain $u$, we could take a cube root, if we knew $u^3$.
3. But a swap exchanges $u^3$ with $v^3$. We need to separate them first.
4. Their antisymmetric difference $y=u^3-v^3$ has a symmetric square. That is something we can calculate immediately.

So the dependency we discover last is the one we calculate first.

## Calculation follows those dependencies forwards

At the beginning, all six permutations in $S_3$ are invisible to the coefficients. Compute

$$
y^2=q^2+\frac{4p^3}{27}.
$$

Choose a square root $y$. This distinguishes $u^3$ from $v^3$:

$$
u^3=\frac{-q+y}{2},\qquad v^3=\frac{-q-y}{2}.
$$

The permutations still invisible to this choice are the three even ones, $A_3$. Now take a cube root $u$. Recover $v$ from $uv=-p/3$, with the zero case handled as in the previous chapter. The three choices of $u$ give the three root labels:

$$
r_1=u+v,\qquad
r_2=\omega u+\omega^2v,\qquad
r_3=\omega^2u+\omega v.
$$

The group chain records what each choice resolved:

$$
S_3\supset A_3\supset\{1\},
\qquad |S_3/A_3|=2,\quad |A_3/\{1\}|=3.
$$

The first step needs a square root, the second a cube root. Written as a nested formula, the square root is inside the cube root; in calculation order it comes first.

## The same obstruction, one level up

The second decomposition isn't a new trick. We applied the two-way split to the orbit $\{u^3,v^3\}$:

$$
u^3=\frac{u^3+v^3}{2}+\frac{u^3-v^3}{2}.
$$

The swap acts on that pair just as it acted on the roots of a quadratic. This is the recursion I wanted to see: make a piece simpler under some permutations, then examine the ambiguity that remains.

<!-- block: quartic -->
The quartic doesn't need a mysterious new substitution. But saying “the same trick again” skips an actual new point: this time two commuting swaps can be used together.

## Three double swaps

Shift the quartic to $x^4+px^2+qx+r$, so the four roots sum to zero. Consider

$$
a=(12)(34),\qquad b=(13)(24),\qquad c=(14)(23).
$$

Together with the identity they form the Klein four-group $V_4$. Each swap has order two and they commute: $ab=ba=c$.

The simultaneous split gives three nonconstant pieces:

$$
\begin{aligned}
s_1&=r_1+r_2-r_3-r_4,\\
s_2&=r_1-r_2+r_3-r_4,\\
s_3&=r_1-r_2-r_3+r_4.
\end{aligned}
$$

Every element of $V_4$ only changes the signs of these pieces. They reconstruct the roots:

$$
\begin{aligned}
4r_1&=s_1+s_2+s_3,&4r_2&=s_1-s_2-s_3,\\
4r_3&=-s_1+s_2-s_3,&4r_4&=-s_1-s_2+s_3.
\end{aligned}
$$

The next chapter works out the decomposition rather than taking this on faith.

## Why a cubic appears

The three squares $s_1^2,s_2^2,s_3^2$ are fixed by $V_4$. The other permutations shuffle them. For instance, $(12)$ sends $s_2$ to $-s_3$ and $s_3$ to $-s_2$, so it swaps their squares.

The quotient $S_4/V_4$ is $S_3$. We have three quantities whose symmetric functions are symmetric in the original roots, hence computable from the coefficients. Those quantities are the roots of the resolvent cubic

$$
t^3+8pt^2+16(p^2-4r)t-64q^2=0.
$$

Solve that cubic first. Then recover the $s_i$ with square roots and put them into the four expressions above.

The signs must agree with the symmetric product $s_1s_2s_3=-8q$. Generically, two chosen square roots determine the third through that product. If a factor vanishes, don't divide by it; for example $q=0$ makes the original equation biquadratic, which can be solved as a quadratic in $x^2$.

## The chain behind the calculation

$$
S_4\supset A_4\supset V_4\supset C_2\supset\{1\}.
$$

The quotient orders are $2,3,2,2$. The resolvent cubic accounts for the first square root and cube root; the remaining two steps account for the two independent sign choices.

This favourable degree reduction isn't guaranteed for an arbitrary subgroup. If we start with a four-cycle, its fixed quantity can have a six-element orbit under $S_4$. The full group still acts on that orbit, but $S_4/C_4$ is **not** a quotient group because $C_4$ isn't normal. Just finding a cyclic subgroup isn't enough to give a normal step in the required chain.

<!-- block: commuting-swaps -->
The phrase “average over four elements with sign weights” was doing too much work in the original conversation. Here is what it actually means for the quartic.

## Split by one swap

Let $a=(12)(34)$ and $b=(13)(24)$. First split $r_1$ using $a$:

$$
u_+=\frac{r_1+r_2}{2},\qquad
u_-=\frac{r_1-r_2}{2}.
$$

The first piece is fixed by $a$, and the second is negated.

## Why the next swap doesn't undo the split

Suppose $a(y)=\lambda y$, with $\lambda$ in the fixed constant field. Because $a$ and $b$ commute,

$$
a(b(y))=b(a(y))=b(\lambda y)=\lambda b(y).
$$

So $b(y)$ stays in the same $a$-eigenspace. We can split each piece again using $b$, without mixing the first split back together.

The step $b(\lambda y)=\lambda b(y)$ doesn't assume that $b$ scales $y$. It holds because $b$ fixes the scalar $\lambda$ and preserves multiplication. That was another small point I had to ask about explicitly.

## Do the second split

Apply the symmetric/antisymmetric split to each $u_\pm$:

$$
\begin{aligned}
\frac{u_++b(u_+)}2&=\frac{r_1+r_2+r_3+r_4}{4},\\
\frac{u_+-b(u_+)}2&=\frac{r_1+r_2-r_3-r_4}{4},\\
\frac{u_-+b(u_-)}2&=\frac{r_1-r_2+r_3-r_4}{4},\\
\frac{u_--b(u_-)}2&=\frac{r_1-r_2-r_3+r_4}{4}.
\end{aligned}
$$

The first is zero for the shifted quartic; the others are $s_1/4,s_2/4,s_3/4$. They add back to $r_1$.

| Piece | Under $a$ | Under $b$ |
| --- | --- | --- |
| $s_1$ | $+s_1$ | $-s_1$ |
| $s_2$ | $-s_2$ | $+s_2$ |
| $s_3$ | $-s_3$ | $-s_3$ |

That's simultaneous eigendecomposition in this example. Two ordinary two-way splits can coexist because the swaps commute. We don't need $V_4$ itself to be cyclic; it can be resolved into two cyclic steps.

<!-- block: shape -->
By this point I could follow the calculations, but wanted the general shape. Why does the possibility of a formula become a property of a group?

## What one radical can see

Suppose $H$ is the current group of ambiguities and we have a nonzero quantity $y$ in the relevant field with

$$
y^m=k,
$$

where $k$ is already known. Assume the needed $m$th roots of unity are among the fixed constants. For any $g\in H$,

$$
g(y)^m=g(k)=k=y^m,
\qquad g(y)=\chi(g)y,\quad \chi(g)^m=1.
$$

The scalars define a homomorphism $\chi:H\to\mu_m$. Its kernel is the subgroup still fixing $y$. That kernel is normal, and the quotient is the cyclic image of $\chi$.

The original group needn't commute. Its action on **this particular quantity** factors through a cyclic quotient. This distinction matters: nonabelian groups can still have sign characters.

## Read several radicals as a chain

In the generic setting, include the required roots of unity in the constant field before carrying out these constructions. A successful radical construction can then be described by

$$
G=H_0\supset H_1\supset\cdots\supset H_r=\{1\},
$$

where $H_{i+1}$ is normal in $H_i$ and $H_i/H_{i+1}$ is cyclic. A finite group admitting such a chain is solvable. Allowing abelian quotients gives the same class of finite groups, since an abelian step can be refined into cyclic ones.

The subgroups aren't required to be cyclic. For the quartic, neither $A_4$ nor $V_4$ is cyclic, but all four successive quotients in the displayed chain are.

## The obstruction at five

For the general quintic, $G=S_5$. The sign character gives the first quotient $S_5/A_5\cong C_2$. After that, $A_5$ has no nontrivial proper normal subgroup, and $A_5$ itself is nonabelian. It has no nontrivial cyclic quotient.

So the radical-step construction can't continue. A decomposition against some smaller cyclic subgroup of $A_5$ is still possible; it just doesn't supply the normal cyclic quotient we need to resolve the remaining ambiguity.

This explains the obstruction within the construction. To conclude that **no** radical formula can evade it by using intermediate numbers outside the original splitting field, we need the full solvability theorem. That last qualification is important: the elementary scalar calculation alone hasn't proved Abel–Ruffini.

<!-- block: galois -->
The final question was what Galois theory contributes once the symmetry calculations have started to make sense. For me the useful answer is a dictionary: the numbers we know and the permutations we can still fail to notice describe the same situation from opposite sides.

## The known world is a field

A field is a collection closed under addition, subtraction, multiplication and division by nonzero quantities. Begin with a coefficient field $K$. Adjoining a new number makes a larger field.

Let $L$ be the splitting field: the field generated over $K$ by all roots. The Galois group $\operatorname{Gal}(L/K)$ consists of the field automorphisms fixing $K$. They permute roots while respecting the algebraic relations among them.

For a general polynomial, the coefficients are independent symbols and the group is $S_n$. For a particular polynomial over, say, $\mathbb Q$, extra relations may give a smaller group. Extending a *numerical* polynomial's coefficient field all the way to $\mathbb C$ would make its Galois group trivial; that isn't the question about formulas over its original coefficients.

## Knowing more means fewer invisible permutations

For a finite Galois extension in characteristic zero, intermediate fields correspond to subgroups, with inclusion reversed:

$$
K\subseteq F\subseteq L
\qquad\longleftrightarrow\qquad
G\supseteq\operatorname{Gal}(L/F)\supseteq\{1\}.
$$

The elements fixed by $\operatorname{Gal}(L/F)$ are exactly the elements of $F$. This supplies the rule we kept using: invariant under the remaining ambiguity means expressible in terms of the currently known field.

When a subgroup is normal, the corresponding intermediate extension is Galois and the quotient is its Galois group. This is what makes the next ambiguity a group in its own right, rather than just a collection of labels.

## Where radicals enter the dictionary

Over a characteristic-zero field containing the relevant roots of unity, a cyclic Galois extension of degree $m$ can be generated by a $y$ with $y^m\in K$. Weighted averaging, or a Lagrange resolvent, produces such an eigenpiece; one chooses an input whose projection isn't zero.

Conversely, adjoining an $m$th root over such a field produces a cyclic extension whose degree **divides** $m$. It needn't have degree exactly $m$: the radical may already be partially known.

This links radical steps to normal subgroups with cyclic quotients. A chain that reaches the identity accounts for all the ambiguity.

## The full theorem, including the gap

In characteristic zero, a polynomial is solvable by radicals over its coefficient field if and only if its Galois group is solvable.

“Solvable by radicals” means there is a radical tower whose final field **contains** the splitting field. The tower needn't stay inside that splitting field. For the necessity direction, adjoin the finitely many roots of unity required by a proposed formula and the conjugates of its successive radicals. This gives a finite normal extension with solvable Galois group containing the original splitting field. Restriction exhibits the original Galois group as a quotient; a quotient of a solvable group is solvable.

That closes the loophole the elementary calculations left open. It is the part that makes “the construction gets stuck at $A_5$” a statement about every radical formula, rather than just about our chosen method.

Since $S_2,S_3,S_4$ are solvable and $S_5$ isn't, the familiar formulas exist through degree four but no radical formula solves the general quintic. Some particular quintics still have solvable groups, and nothing here prevents numerical methods.

For the formal statements and proofs, see [Milne, *Fields and Galois Theory*](https://www.jmilne.org/math/Books/FT0.pdf#page=64), Theorem 3.28 and the solvability discussion in Section 5.
