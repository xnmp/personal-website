/**
 * Legal move generation for Zheng Shang You.
 *
 * Mirrors src/zsy/legal_moves.py, minus all wildcard handling (v1). When
 * leading (lastCombo === null) every valid combination is returned. When
 * following, only combinations that beat the active combo are returned;
 * pass is implicit and always available to the follower.
 */

import { Card, Rank, Suit, STANDARD_SUITS, isJoker } from "./cards";
import { Combo, ComboType, STRAIGHT_RANKS, beats } from "./combos";

/** All k-sized subsets of `arr`. */
const combinations = <T>(arr: readonly T[], k: number): T[][] => {
  const result: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) {
      result.push([...acc]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i]);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return result;
};

interface HandContext {
  readonly groups: Map<Rank, Card[]>; // non-joker cards by rank
  readonly jokers: Card[];
}

const analyze = (hand: readonly Card[]): HandContext => {
  const groups = new Map<Rank, Card[]>();
  const jokers: Card[] = [];
  for (const c of hand) {
    if (isJoker(c)) jokers.push(c);
    else {
      const g = groups.get(c.rank);
      if (g) g.push(c);
      else groups.set(c.rank, [c]);
    }
  }
  return { groups, jokers };
};

const single = (c: Card): Combo => ({ type: "single", cards: [c], primaryRank: c.rank, bombSize: 0 });

const enumSingles = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (const cards of ctx.groups.values()) for (const c of cards) out.push(single(c));
  for (const j of ctx.jokers) out.push(single(j));
  return out;
};

const enumPairs = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (const [rank, cards] of ctx.groups) {
    if (cards.length >= 2) {
      for (const pair of combinations(cards, 2)) {
        out.push({ type: "pair", cards: pair, primaryRank: rank, bombSize: 0 });
      }
    }
  }
  // Joker pairs (same suit) — impossible in a single deck but kept for parity.
  for (const suit of ["SJ", "BJ"] as Suit[]) {
    const same = ctx.jokers.filter((j) => j.suit === suit);
    if (same.length >= 2) {
      out.push({ type: "pair", cards: same.slice(0, 2), primaryRank: 13, bombSize: 0 });
    }
  }
  return out;
};

const enumTriples = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (const [rank, cards] of ctx.groups) {
    if (cards.length >= 3) {
      for (const triple of combinations(cards, 3)) {
        out.push({ type: "triple", cards: triple, primaryRank: rank, bombSize: 0 });
      }
    }
  }
  return out;
};

const enumFullHouses = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (const [tRank, tCards] of ctx.groups) {
    if (tCards.length < 3) continue;
    for (const triple of combinations(tCards, 3)) {
      for (const [pRank, pCards] of ctx.groups) {
        if (pRank === tRank) continue;
        if (pCards.length >= 2) {
          for (const pair of combinations(pCards, 2)) {
            out.push({ type: "triple_plus_pair", cards: [...triple, ...pair], primaryRank: tRank, bombSize: 0 });
          }
        }
      }
    }
  }
  return out;
};

/** Cartesian product: one card per rank position. */
const productCombos = (type: ComboType, ranks: Rank[], cardsPerRank: Card[][]): Combo[] => {
  let picks: Card[][] = [[]];
  for (const rc of cardsPerRank) {
    const next: Card[][] = [];
    for (const existing of picks) for (const card of rc) next.push([...existing, card]);
    picks = next;
  }
  const top = Math.max(...ranks);
  return picks.map((pick) => ({ type, cards: pick, primaryRank: top, bombSize: 0 }));
};

const enumStraights = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (let start = 0; start <= STRAIGHT_RANKS.length - 5; start++) {
    const target = [0, 1, 2, 3, 4].map((i) => STRAIGHT_RANKS[start + i]);
    if (target.every((r) => (ctx.groups.get(r)?.length ?? 0) > 0)) {
      out.push(...productCombos("straight", target, target.map((r) => ctx.groups.get(r)!)));
    }
  }
  return out;
};

const enumStraightFlushes = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (let start = 0; start <= STRAIGHT_RANKS.length - 5; start++) {
    const target = [0, 1, 2, 3, 4].map((i) => STRAIGHT_RANKS[start + i]);
    for (const suit of STANDARD_SUITS) {
      const present: Card[] = [];
      for (const r of target) {
        const suited = (ctx.groups.get(r) ?? []).find((c) => c.suit === suit);
        if (suited) present.push(suited);
      }
      if (present.length === 5) {
        out.push({ type: "straight_flush", cards: present, primaryRank: Math.max(...target), bombSize: 0 });
      }
    }
  }
  return out;
};

const enumConsecutivePairs = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (let start = 0; start <= STRAIGHT_RANKS.length - 3; start++) {
    const target = [0, 1, 2].map((i) => STRAIGHT_RANKS[start + i]);
    const perRank = target.map((r) => ctx.groups.get(r) ?? []);
    if (perRank.every((rc) => rc.length >= 2)) {
      const pairOptions = perRank.map((rc) => combinations(rc, 2));
      for (const p0 of pairOptions[0])
        for (const p1 of pairOptions[1])
          for (const p2 of pairOptions[2]) {
            out.push({ type: "consecutive_pairs", cards: [...p0, ...p1, ...p2], primaryRank: Math.max(...target), bombSize: 0 });
          }
    }
  }
  return out;
};

const enumConsecutiveTriples = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (let start = 0; start <= STRAIGHT_RANKS.length - 2; start++) {
    const target = [0, 1].map((i) => STRAIGHT_RANKS[start + i]);
    const perRank = target.map((r) => ctx.groups.get(r) ?? []);
    if (perRank.every((rc) => rc.length >= 3)) {
      const tripleOptions = perRank.map((rc) => combinations(rc, 3));
      for (const t0 of tripleOptions[0])
        for (const t1 of tripleOptions[1]) {
          out.push({ type: "consecutive_triples", cards: [...t0, ...t1], primaryRank: Math.max(...target), bombSize: 0 });
        }
    }
  }
  return out;
};

const enumBombs = (ctx: HandContext): Combo[] => {
  const out: Combo[] = [];
  for (const [rank, cards] of ctx.groups) {
    if (cards.length >= 4) {
      for (let size = 4; size <= cards.length; size++) {
        for (const bomb of combinations(cards, size)) {
          out.push({ type: "bomb", cards: bomb, primaryRank: rank, bombSize: size });
        }
      }
    }
  }
  return out;
};

const allCombinations = (ctx: HandContext): Combo[] => [
  ...enumSingles(ctx),
  ...enumPairs(ctx),
  ...enumTriples(ctx),
  ...enumFullHouses(ctx),
  ...enumStraights(ctx),
  ...enumStraightFlushes(ctx),
  ...enumConsecutivePairs(ctx),
  ...enumConsecutiveTriples(ctx),
  ...enumBombs(ctx),
];

const GENERATORS: Record<string, (ctx: HandContext) => Combo[]> = {
  single: enumSingles,
  pair: enumPairs,
  triple: enumTriples,
  triple_plus_pair: enumFullHouses,
  straight: enumStraights,
  straight_flush: enumStraightFlushes,
  consecutive_pairs: enumConsecutivePairs,
  consecutive_triples: enumConsecutiveTriples,
  bomb: enumBombs,
};

const beatingCombinations = (ctx: HandContext, active: Combo): Combo[] => {
  const out: Combo[] = [];
  const gen = GENERATORS[active.type];
  if (gen) for (const c of gen(ctx)) if (beats(c, active)) out.push(c);

  if (!(active.type === "bomb" || active.type === "straight_flush")) {
    // Any bomb / straight flush beats a non-bomb.
    out.push(...enumBombs(ctx), ...enumStraightFlushes(ctx));
  } else if (active.type === "bomb") {
    for (const c of enumStraightFlushes(ctx)) if (beats(c, active)) out.push(c);
    // enumBombs already handled above via same-type generator (all sizes).
  }
  return out;
};

/**
 * Enumerate all legal non-pass plays from `hand`. When following (lastCombo
 * provided) only beating combos are returned — pass is implicit for followers.
 */
export const legalMoves = (hand: readonly Card[], lastCombo: Combo | null): Combo[] => {
  if (hand.length === 0) return [];
  const ctx = analyze(hand);
  if (lastCombo === null || lastCombo.type === "pass") return allCombinations(ctx);
  return beatingCombinations(ctx, lastCombo);
};
