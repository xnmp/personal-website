/**
 * Heuristic AI for Zheng Shang You.
 *
 * Ports the SPIRIT of StrategicAgent in src/zsy/strategic_agent.py (which is
 * itself informed by the min-steps oracle in src/zsy/oracle.py):
 *
 * - Every candidate is scored by a min-steps-to-shed oracle. A move is
 *   "efficient" (cost 0) when playing it keeps the hand on its shortest
 *   decomposition; breaking a bomb to play a small combo is penalised.
 * - Control counting: a combo is a "winner" if no unseen non-bomb combo of the
 *   same type can beat it. Winners are saved unless they win the race.
 * - Bombs are held unless an opponent is about to go out, or bombing seizes
 *   control with an immediate run-out.
 * - Pass discipline: pass rather than break the decomposition for a harmless
 *   trick; don't feed low singles when an opponent is on their last card.
 *
 * Deterministic given the state. Teams are dropped (individual play, v1).
 */

import { Card, Rank, RANK, isJoker } from "./cards";
import { Combo, isBomb } from "./combos";
import { GameState, Move } from "./game";
import { legalMoves } from "./legal";

const NUM_STD = 13;
// STRAIGHT_RANKS as raw indices 0..11 (THREE..ACE); 2 and jokers excluded.
const SI: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const EXACT_THRESHOLD = 10;
const DANGER_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Min-steps oracle (oracle.py, without wildcards). State layout:
// [counts[0..12], smallJokers(13), bigJokers(14)].
// ---------------------------------------------------------------------------

type OState = number[];

const handToState = (hand: readonly Card[]): OState => {
  const s: OState = new Array(15).fill(0);
  for (const c of hand) {
    if (c.suit === "SJ") s[13] += 1;
    else if (c.suit === "BJ") s[14] += 1;
    else s[c.rank] += 1;
  }
  return s;
};

const total = (s: OState): number => s.reduce((a, b) => a + b, 0);

const memo = new Map<string, number>();
const key = (s: OState): string => s.join(",");

const enumeratePlays = (s: OState): OState[] => {
  const c = s.slice(0, NUM_STD);
  const sj = s[13];
  const bj = s[14];
  const seen = new Set<string>();
  const out: OState[] = [];
  const add = (nc: number[], nsj: number, nbj: number) => {
    const st = [...nc, nsj, nbj];
    const k = st.join(",");
    if (!seen.has(k)) {
      seen.add(k);
      out.push(st);
    }
  };

  // Consecutive triples (6 cards): two adjacent ranks each with >=3.
  for (let start = 0; start < SI.length - 1; start++) {
    const i0 = SI[start], i1 = SI[start + 1];
    if (c[i0] >= 3 && c[i1] >= 3) {
      const nc = [...c]; nc[i0] -= 3; nc[i1] -= 3; add(nc, sj, bj);
    }
  }
  // Consecutive pairs (6 cards): three adjacent ranks each with >=2.
  for (let start = 0; start < SI.length - 2; start++) {
    const idxs = [SI[start], SI[start + 1], SI[start + 2]];
    if (idxs.every((i) => c[i] >= 2)) {
      const nc = [...c]; for (const i of idxs) nc[i] -= 2; add(nc, sj, bj);
    }
  }
  // Full houses (5 cards).
  for (let t = 0; t < NUM_STD; t++) {
    if (c[t] < 3) continue;
    for (let p = 0; p < NUM_STD; p++) {
      if (p === t || c[p] < 2) continue;
      const nc = [...c]; nc[t] -= 3; nc[p] -= 2; add(nc, sj, bj);
    }
  }
  // Straights (5 cards).
  for (let start = 0; start < SI.length - 4; start++) {
    const idxs = [0, 1, 2, 3, 4].map((i) => SI[start + i]);
    if (idxs.every((i) => c[i] >= 1)) {
      const nc = [...c]; for (const i of idxs) nc[i] -= 1; add(nc, sj, bj);
    }
  }
  // Bombs (4+ of a kind).
  for (let r = 0; r < NUM_STD; r++) {
    for (let size = 4; size <= c[r]; size++) {
      const nc = [...c]; nc[r] -= size; add(nc, sj, bj);
    }
  }
  // Triples.
  for (let r = 0; r < NUM_STD; r++) {
    if (c[r] >= 3) { const nc = [...c]; nc[r] -= 3; add(nc, sj, bj); }
  }
  // Pairs.
  for (let r = 0; r < NUM_STD; r++) {
    if (c[r] >= 2) { const nc = [...c]; nc[r] -= 2; add(nc, sj, bj); }
  }
  if (sj >= 2) add([...c], sj - 2, bj);
  if (bj >= 2) add([...c], sj, bj - 2);
  // Singles.
  for (let r = 0; r < NUM_STD; r++) {
    if (c[r] >= 1) { const nc = [...c]; nc[r] -= 1; add(nc, sj, bj); }
  }
  if (sj >= 1) add([...c], sj - 1, bj);
  if (bj >= 1) add([...c], sj, bj - 1);

  return out;
};

const minStepsExact = (s: OState): number => {
  const t = total(s);
  if (t === 0) return 0;
  if (t === 1) return 1;
  const k = key(s);
  const cached = memo.get(k);
  if (cached !== undefined) return cached;

  let best = t;
  for (const next of enumeratePlays(s)) {
    const lb = Math.ceil(total(next) / 6); // any play sheds <=6 cards
    if (1 + lb >= best) continue;
    const steps = 1 + minStepsExact(next);
    if (steps < best) {
      best = steps;
      if (best === 1) break;
    }
  }
  memo.set(k, best);
  return best;
};

// Greedy removers for large hands (oracle.py _min_steps_greedy).
type Remover = (c: number[]) => number;

const removeConsecTriples: Remover = (c) => {
  let plays = 0, changed = true;
  while (changed) {
    changed = false;
    for (let start = 0; start < SI.length - 1; start++) {
      const i0 = SI[start], i1 = SI[start + 1];
      if (c[i0] >= 3 && c[i1] >= 3) { c[i0] -= 3; c[i1] -= 3; plays++; changed = true; break; }
    }
  }
  return plays;
};
const removeConsecPairs: Remover = (c) => {
  let plays = 0, changed = true;
  while (changed) {
    changed = false;
    for (let start = 0; start < SI.length - 2; start++) {
      const idxs = [SI[start], SI[start + 1], SI[start + 2]];
      if (idxs.every((i) => c[i] >= 2)) { for (const i of idxs) c[i] -= 2; plays++; changed = true; break; }
    }
  }
  return plays;
};
const removeStraights: Remover = (c) => {
  let plays = 0, changed = true;
  while (changed) {
    changed = false;
    for (let start = 0; start < SI.length - 4; start++) {
      const idxs = [0, 1, 2, 3, 4].map((i) => SI[start + i]);
      if (idxs.every((i) => c[i] >= 1)) { for (const i of idxs) c[i] -= 1; plays++; changed = true; break; }
    }
  }
  return plays;
};
const removeFullHouses: Remover = (c) => {
  let plays = 0, changed = true;
  while (changed) {
    changed = false;
    let bestT = -1;
    for (let t = 0; t < NUM_STD; t++) if (c[t] >= 3 && (bestT === -1 || c[t] > c[bestT])) bestT = t;
    if (bestT === -1) break;
    let bestP = -1;
    for (let p = 0; p < NUM_STD; p++) {
      if (p === bestT || c[p] < 2) continue;
      if (bestP === -1 || c[p] > c[bestP]) bestP = p;
    }
    if (bestP === -1) break;
    c[bestT] -= 3; c[bestP] -= 2; plays++; changed = true;
  }
  return plays;
};
const removeBombs: Remover = (c) => {
  let plays = 0;
  for (let r = 0; r < NUM_STD; r++) if (c[r] >= 4) { c[r] = 0; plays++; }
  return plays;
};
const removeTriples: Remover = (c) => {
  let plays = 0;
  for (let r = 0; r < NUM_STD; r++) if (c[r] >= 3) { c[r] -= 3; plays++; }
  return plays;
};
const removePairs: Remover = (c) => {
  let plays = 0;
  for (let r = 0; r < NUM_STD; r++) if (c[r] >= 2) { c[r] -= 2; plays++; }
  return plays;
};

const ORDERINGS: Remover[][] = [
  [removeConsecTriples, removeConsecPairs, removeStraights, removeFullHouses, removeBombs, removeTriples, removePairs],
  [removeStraights, removeConsecTriples, removeConsecPairs, removeFullHouses, removeBombs, removeTriples, removePairs],
  [removeFullHouses, removeConsecTriples, removeConsecPairs, removeStraights, removeBombs, removeTriples, removePairs],
  [removeTriples, removePairs, removeConsecTriples, removeConsecPairs, removeStraights, removeFullHouses, removeBombs],
];

const minStepsGreedy = (s: OState): number => {
  let best = total(s);
  for (const ordering of ORDERINGS) {
    const c = s.slice(0, NUM_STD);
    let plays = 0;
    for (const remover of ordering) plays += remover(c);
    const remaining: OState = [...c, s[13], s[14]];
    const rt = total(remaining);
    plays += rt <= EXACT_THRESHOLD ? minStepsExact(remaining) : rt;
    if (plays < best) best = plays;
  }
  return best;
};

const minSteps = (s: OState): number =>
  total(s) <= EXACT_THRESHOLD ? minStepsExact(s) : minStepsGreedy(s);

// ---------------------------------------------------------------------------
// Ranking helpers (ranking.py, high-card mechanic dropped: 2 is highest std).
// ---------------------------------------------------------------------------

const effectiveRank = (c: Card): number =>
  c.suit === "BJ" ? 100 : c.suit === "SJ" ? 99 : c.rank;

const effRankCombo = (combo: Combo): number => {
  if (combo.primaryRank === null) return 0;
  if (combo.primaryRank === RANK.JOKER) return Math.max(...combo.cards.map(effectiveRank));
  return combo.primaryRank;
};

// ---------------------------------------------------------------------------
// Unseen tracker + scoring
// ---------------------------------------------------------------------------

interface Unseen {
  counts: number[]; // per standard rank
  smallJokers: number;
  bigJokers: number;
}

/**
 * Cards not in our hand and not yet played. In a single deck with nothing
 * discarded this equals the union of opponents' current hands — exactly the
 * information strategic_agent.py reconstructs from play history.
 */
const buildUnseen = (state: GameState, me: number): Unseen => {
  const counts = new Array(NUM_STD).fill(0);
  let smallJokers = 0, bigJokers = 0;
  state.hands.forEach((hand, p) => {
    if (p === me) return;
    for (const c of hand) {
      if (c.suit === "SJ") smallJokers++;
      else if (c.suit === "BJ") bigJokers++;
      else counts[c.rank]++;
    }
  });
  return { counts, smallJokers, bigJokers };
};

interface Scored {
  move: Combo;
  residual: number;
  cost: number;
  eff: number;
  breaksBomb: boolean;
}

const minOpponentCards = (state: GameState, me: number): number => {
  let min = 99;
  state.hands.forEach((hand, p) => {
    if (p !== me && hand.length > 0) min = Math.min(min, hand.length);
  });
  return min;
};

/** No unseen non-bomb combo of the same type beats `combo` (_is_winner). */
const isWinner = (combo: Combo, u: Unseen): boolean => {
  const eff = effRankCombo(combo);
  const cnt = u.counts;
  switch (combo.type) {
    case "single":
      if (u.bigJokers > 0 && eff < 100) return false;
      if (u.smallJokers > 0 && eff < 99) return false;
      return !cnt.some((n, r) => n >= 1 && r > eff);
    case "pair":
      if (u.bigJokers >= 2 && eff < 100) return false;
      if (u.smallJokers >= 2 && eff < 99) return false;
      return !cnt.some((n, r) => n >= 2 && r > eff);
    case "triple":
      return !cnt.some((n, r) => n >= 3 && r > eff);
    case "triple_plus_pair": {
      const higherTriple = cnt.some((n, r) => n >= 3 && r > eff);
      const anyPair = cnt.some((n) => n >= 2);
      return !(higherTriple && anyPair);
    }
    case "straight":
    case "consecutive_pairs":
    case "consecutive_triples": {
      const [window, need] =
        combo.type === "straight" ? [5, 1] : combo.type === "consecutive_pairs" ? [3, 2] : [2, 3];
      const myTop = combo.primaryRank ?? 0;
      for (let start = 0; start <= SI.length - window; start++) {
        const idxs = SI.slice(start, start + window);
        if (Math.max(...idxs) <= myTop) continue;
        if (idxs.every((i) => cnt[i] >= need)) return false;
      }
      return true;
    }
    default:
      return false;
  }
};

const stateAfter = (state: OState, cards: readonly Card[]): OState => {
  const s = [...state];
  for (const c of cards) {
    if (c.suit === "SJ") s[13]--;
    else if (c.suit === "BJ") s[14]--;
    else s[c.rank]--;
  }
  return s;
};

const comboKey = (combo: Combo): string =>
  `${combo.type}|${combo.primaryRank}|${combo.cards.length}|` +
  combo.cards.map((c) => `${c.rank}-${c.suit}`).sort().join(",");

// Comparators returning the minimum/maximum element by a numeric key vector.
const minBy = <T>(xs: T[], f: (x: T) => number[]): T =>
  xs.reduce((a, b) => (lexLess(f(b), f(a)) ? b : a));
const maxBy = <T>(xs: T[], f: (x: T) => number): T =>
  xs.reduce((a, b) => (f(b) > f(a) ? b : a));
const lexLess = (a: number[], b: number[]): boolean => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
};

/**
 * Choose a move for the current player. Returns a Combo to play, or "pass".
 * Deterministic given the state.
 */
export const chooseMove = (state: GameState): Move => {
  const me = state.currentPlayer;
  const hand = state.hands[me];
  const nonPass = legalMoves(hand, state.lastCombo);
  if (nonPass.length === 0) return "pass";

  const handState = handToState(hand);
  const mySteps = minSteps(handState);
  const bombRanks = new Set<Rank>();
  for (let r = 0; r < NUM_STD; r++) if (handState[r] >= 4) bombRanks.add(r);

  const scored: Scored[] = [];
  const seen = new Set<string>();
  for (const combo of nonPass) {
    const k = comboKey(combo);
    if (seen.has(k)) continue;
    seen.add(k);
    const residual = minSteps(stateAfter(handState, combo.cards));
    const cost = 1 + residual - mySteps;
    const breaksBomb =
      !isBomb(combo) && combo.cards.some((c) => !isJoker(c) && bombRanks.has(c.rank));
    scored.push({ move: combo, residual, cost, eff: effRankCombo(combo), breaksBomb });
  }

  const unseen = buildUnseen(state, me);
  const oppMin = minOpponentCards(state, me);
  const danger = oppMin <= DANGER_THRESHOLD;
  const leading = state.lastCombo === null || state.lastCombo.type === "pass";

  return leading
    ? lead(scored, mySteps, unseen, oppMin)
    : follow(scored, mySteps, danger);
};

const lead = (scored: Scored[], mySteps: number, unseen: Unseen, oppMin: number): Move => {
  // Immediate win: empty the hand in one play.
  for (const sm of scored) if (sm.residual === 0) return sm.move;

  const efficient =
    pickNonEmpty(scored.filter((s) => s.cost === 0 && !s.breaksBomb)) ??
    pickNonEmpty(scored.filter((s) => s.cost === 0)) ??
    scored;
  const winners = efficient.filter((s) => isWinner(s.move, unseen));

  // Guaranteed run-out (2 steps left) or race (opponent nearly out): cash a winner.
  if (winners.length > 0 && (mySteps === 2 || oppMin <= 2)) {
    return maxBy(winners, (s) => s.eff).move;
  }

  const nonWinners = pickNonEmpty(efficient.filter((s) => !winners.includes(s))) ?? efficient;

  // Opponent on their last card: don't feed a low single.
  if (oppMin === 1) {
    const multi = nonWinners.filter((s) => s.move.cards.length > 1);
    if (multi.length > 0) return minBy(multi, (s) => [s.eff, -s.move.cards.length]).move;
    return maxBy(nonWinners, (s) => s.eff).move;
  }

  return minBy(nonWinners, (s) => [s.eff, -s.move.cards.length]).move;
};

const follow = (scored: Scored[], mySteps: number, danger: boolean): Move => {
  // Winning the trick with our last play wins the game outright.
  for (const sm of scored) if (sm.residual === 0) return sm.move;

  const nonBombs = scored.filter((s) => !isBomb(s.move));
  const bombs = scored.filter((s) => isBomb(s.move));
  const fight = danger || mySteps <= 3;

  const free = nonBombs.filter((s) => s.cost === 0 && (fight || !s.breaksBomb));
  if (free.length > 0) return minBy(free, (s) => [s.eff]).move;

  const candidates = nonBombs.filter((s) => fight || !s.breaksBomb);
  if (candidates.length > 0) {
    const best = minBy(candidates, (s) => [s.cost, s.eff]);
    if (fight || (best.cost <= 1 && best.eff < 40)) return best.move;
  }

  if (bombs.length > 0 && shouldBomb(mySteps, danger, bombs)) {
    return minBy(bombs, (s) => [s.move.bombSize, s.eff]).move;
  }

  return "pass";
};

const shouldBomb = (mySteps: number, danger: boolean, bombs: Scored[]): boolean => {
  const cheapest = Math.min(...bombs.map((s) => s.residual));
  return danger || cheapest <= 2 || mySteps <= 3;
};

const pickNonEmpty = <T>(xs: T[]): T[] | null => (xs.length > 0 ? xs : null);
