/**
 * A deterministic synthetic "signups" dataset with an embedded cohort story,
 * mirroring the app's sample data. ~2,000 rows, generated from a seeded PRNG so
 * every visitor sees the exact same points (and the same contrast numbers).
 *
 * The story: power users (long sessions, mid-30s to mid-40s) are dominated by
 * the *pro* plan and by desktop platforms. Brush that cloud in the scatter and
 * every responder panel recolours — pro lights up red (over-represented), free
 * goes blue (under), and the revenue/platform mix shifts with it.
 */

export const PLANS = ["free", "pro", "team"] as const;
export const PLATFORMS = ["web", "ios", "android", "mac", "windows"] as const;

export interface Row {
  age: number;
  sessionMinutes: number;
  plan: number; // index into PLANS
  platform: number; // index into PLATFORMS
  revenue: number; // monthly $, 0 for free
}

/** mulberry32 — same seeded PRNG family the app uses for reproducibility. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller normal from a uniform generator. */
function normal(rng: () => number, mean: number, sd: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const pick = (rng: () => number, weights: number[]): number => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
};

export function generateSignups(n = 2000, seed = 0x5eed): Row[] {
  const rng = mulberry32(seed);
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    // Plan mix: free 58%, pro 30%, team 12%.
    const plan = pick(rng, [58, 30, 12]);

    // Age & session depend on plan — this is the cohort signal.
    let age: number;
    let session: number;
    if (plan === 0) {
      age = normal(rng, 29, 9);
      session = Math.abs(normal(rng, 22, 16));
    } else if (plan === 1) {
      age = normal(rng, 38, 7);
      session = Math.abs(normal(rng, 96, 28));
    } else {
      age = normal(rng, 43, 8);
      session = Math.abs(normal(rng, 72, 24));
    }
    age = Math.round(Math.max(18, Math.min(68, age)));
    session = Math.round(Math.max(1, Math.min(240, session)));

    // Platform: pro/team skew desktop (mac/windows), free skews mobile.
    const platform =
      plan === 0
        ? pick(rng, [26, 24, 30, 12, 8]) // web/ios/android/mac/win
        : pick(rng, [22, 8, 6, 34, 30]);

    const revenue =
      plan === 0 ? 0 : plan === 1 ? Math.round(normal(rng, 29, 3)) : Math.round(normal(rng, 99, 8));

    rows.push({ age, sessionMinutes: session, plan, platform, revenue });
  }
  return rows;
}

/** Age histogram bin edges + labels for the responder panel. */
export const AGE_BINS = [18, 26, 34, 42, 50, 58, 68] as const;
export const AGE_BIN_LABELS = AGE_BINS.slice(0, -1).map(
  (lo, i) => `${lo}–${AGE_BINS[i + 1]}`,
);

export const ageBinOf = (age: number): number => {
  for (let i = 0; i < AGE_BINS.length - 1; i++) {
    if (age < AGE_BINS[i + 1]) return i;
  }
  return AGE_BINS.length - 2;
};
