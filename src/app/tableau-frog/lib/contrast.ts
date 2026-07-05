/**
 * Contrast math — ported from tableau-frog's domain/contrast.ts + stats.ts.
 *
 * Given a subset of rows (a mask), how over/under-represented is each group
 * relative to the whole population? We compare each group's share of the
 * subset with its share of the population as a log-ratio, ln(p_subset /
 * p_population), clamped to ±ln(4) — a 2× lift reads half-saturated, ≥4× fully
 * saturated. Each group also gets a two-proportion z-test (subset vs the rest
 * of the population) and a Benjamini-Hochberg FDR correction, so a colour only
 * "counts" when the enrichment is statistically real.
 */

export const LOG_RATIO_CLAMP = Math.log(4);
export const SMALL_N = 20;
export const SIGNIFICANCE_Q = 0.05;

export type ContrastMode = "ratio" | "significant";

export interface GroupContrast {
  label: string;
  count: number;
  selected: number;
  logRatio: number;
  /** logRatio normalised to [-1, 1] for colour mapping */
  t: number;
  trusted: boolean;
  /** two-sided p-value */
  p: number;
  /** BH-adjusted q-value across this panel's groups */
  q: number;
  significant: boolean;
}

/** Standard normal CDF via Abramowitz-Stegun erf (|error| < 1.5e-7). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

const normalCdf = (z: number): number => 0.5 * (1 + erf(z / Math.SQRT2));
const twoSidedP = (z: number): number => 2 * (1 - normalCdf(Math.abs(z)));

/** Two-proportion z-test, pooled SE. Degenerate inputs → z=0, p=1. */
function twoProportionZ(k1: number, n1: number, k2: number, n2: number): number {
  if (n1 <= 0 || n2 <= 0) return 1;
  const pPool = (k1 + k2) / (n1 + n2);
  if (pPool <= 0 || pPool >= 1) return 1;
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return 1;
  const z = (k1 / n1 - k2 / n2) / se;
  return twoSidedP(z);
}

/** Benjamini-Hochberg step-up → FDR q-values (same order as input). */
function benjaminiHochberg(pvals: readonly number[]): number[] {
  const m = pvals.length;
  if (m === 0) return [];
  const order = pvals.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(m);
  let prev = 1;
  for (let rank = m; rank >= 1; rank--) {
    const { p, i } = order[rank - 1];
    const raw = (p * m) / rank;
    prev = Math.min(prev, raw);
    q[i] = Math.max(0, Math.min(1, prev));
  }
  return q;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Contrast + significance for a set of named groups. `groupOf[i]` assigns row i
 * to a group index (-1 = no group); `mask[i]` marks membership in the subset.
 */
export function groupContrasts(
  labels: readonly string[],
  groupOf: Int32Array,
  mask: Uint8Array,
): GroupContrast[] {
  const g = labels.length;
  const count = new Array<number>(g).fill(0);
  const selected = new Array<number>(g).fill(0);
  let total = 0;
  let subsetTotal = 0;
  for (let i = 0; i < groupOf.length; i++) {
    const gi = groupOf[i];
    if (gi < 0 || gi >= g) continue;
    total++;
    count[gi]++;
    if (mask[i]) {
      subsetTotal++;
      selected[gi]++;
    }
  }
  const restTotal = total - subsetTotal;

  const ps = new Array<number>(g).fill(1);
  const testable: number[] = [];
  const pForFamily: number[] = [];
  for (let i = 0; i < g; i++) {
    if (count[i] === 0 || subsetTotal === 0 || restTotal === 0) continue;
    const k2 = count[i] - selected[i];
    const p = twoProportionZ(selected[i], subsetTotal, k2, restTotal);
    ps[i] = p;
    testable.push(i);
    pForFamily.push(p);
  }
  const qs = new Array<number>(g).fill(1);
  const adjusted = benjaminiHochberg(pForFamily);
  testable.forEach((idx, k) => (qs[idx] = adjusted[k]));

  return labels.map((label, i) => {
    const c = count[i];
    const s = selected[i];
    let logRatio = 0;
    if (c > 0 && subsetTotal > 0 && total > 0) {
      const pSub = s / subsetTotal;
      const pPop = c / total;
      logRatio =
        pSub === 0 ? -LOG_RATIO_CLAMP : clamp(Math.log(pSub / pPop), -LOG_RATIO_CLAMP, LOG_RATIO_CLAMP);
    }
    return {
      label,
      count: c,
      selected: s,
      logRatio,
      t: logRatio / LOG_RATIO_CLAMP,
      trusted: c >= SMALL_N,
      p: ps[i],
      q: qs[i],
      significant: qs[i] < SIGNIFICANCE_Q,
    };
  });
}

/** Linear fold of a group's over-representation as a ×N multiple, e.g. 3.1×. */
export function foldMultiple(c: GroupContrast): number {
  return Math.exp(c.logRatio);
}
