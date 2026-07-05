/**
 * Card combination types, detection, and comparison for Zheng Shang You.
 *
 * Mirrors src/zsy/combinations.py. No wildcard handling (v1 simplification).
 *
 * Legal combinations:
 * - single (1), pair (2), triple (3), triple+pair / full house (5)
 * - straight: exactly 5 consecutive ranks, no 2s or jokers
 * - consecutive pairs: exactly 3 consecutive pairs (6 cards)
 * - consecutive triples: exactly 2 consecutive triples (6 cards)
 * - bomb: 4+ of a kind
 * - straight flush: exactly 5 consecutive cards of one suit
 */

import { Card, Rank, RANK, isJoker } from "./cards";

export type ComboType =
  | "single"
  | "pair"
  | "triple"
  | "triple_plus_pair"
  | "straight"
  | "consecutive_pairs"
  | "consecutive_triples"
  | "bomb"
  | "straight_flush"
  | "pass";

export interface Combo {
  readonly type: ComboType;
  readonly cards: readonly Card[];
  /** Primary rank used for same-type comparison (e.g. the triple's rank in a full house). */
  readonly primaryRank: Rank | null;
  /** For bombs: the number of cards (4, 5, 6, ...). 0 otherwise. */
  readonly bombSize: number;
}

/** The pass "move". Not returned by detectCombo; used by legal moves / game. */
export const PASS: Combo = { type: "pass", cards: [], primaryRank: null, bombSize: 0 };

// Ranks that may appear in straights: THREE..ACE (no 2, no joker). combinations.py
// STRAIGHT_RANKS. Indices are contiguous 0..11, so a straight window spans 5
// consecutive values ending no higher than ACE — 2 and jokers are excluded.
export const STRAIGHT_RANKS: readonly Rank[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const isBomb = (c: Combo): boolean =>
  c.type === "bomb" || c.type === "straight_flush";

const areConsecutive = (ranks: readonly Rank[]): boolean => {
  if (ranks.length === 0) return false;
  const sorted = [...ranks].sort((a, b) => a - b);
  for (const r of sorted) if (!STRAIGHT_RANKS.includes(r)) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) return false;
  }
  return true;
};

const rankCounts = (cards: readonly Card[]): Map<Rank, number> => {
  const m = new Map<Rank, number>();
  for (const c of cards) m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  return m;
};

/** Classify a set of cards as a valid combination, or null if invalid. */
export const detectCombo = (cards: readonly Card[]): Combo | null => {
  const n = cards.length;
  if (n === 0) return null;
  const counts = rankCounts(cards);

  if (n === 1) return { type: "single", cards: [...cards], primaryRank: cards[0].rank, bombSize: 0 };

  if (n === 2) {
    if (counts.size === 1 && !isJoker(cards[0])) {
      return { type: "pair", cards: [...cards], primaryRank: cards[0].rank, bombSize: 0 };
    }
    // Joker pair: both jokers, same type (both small or both big). Impossible in a
    // single deck, but detection is defined for arbitrary crafted card sets.
    if (isJoker(cards[0]) && isJoker(cards[1]) && cards[0].suit === cards[1].suit) {
      return { type: "pair", cards: [...cards], primaryRank: RANK.JOKER, bombSize: 0 };
    }
    return null;
  }

  if (n === 3) {
    if (counts.size === 1 && !isJoker(cards[0])) {
      return { type: "triple", cards: [...cards], primaryRank: cards[0].rank, bombSize: 0 };
    }
    return null;
  }

  // 4+ of a kind -> bomb
  if (counts.size === 1 && !isJoker(cards[0])) {
    return { type: "bomb", cards: [...cards], primaryRank: cards[0].rank, bombSize: n };
  }

  if (n === 5) {
    return checkStraightFlush(cards) ?? checkStraight(cards) ?? checkFullHouse(cards);
  }
  if (n === 6) {
    return checkConsecutivePairs(cards) ?? checkConsecutiveTriples(cards);
  }
  return null;
};

const checkStraight = (cards: readonly Card[]): Combo | null => {
  if (cards.length !== 5 || cards.some(isJoker)) return null;
  const ranks = cards.map((c) => c.rank);
  if (new Set(ranks).size !== 5 || !areConsecutive(ranks)) return null;
  return { type: "straight", cards: [...cards], primaryRank: Math.max(...ranks), bombSize: 0 };
};

const checkStraightFlush = (cards: readonly Card[]): Combo | null => {
  if (cards.length !== 5 || cards.some(isJoker)) return null;
  if (new Set(cards.map((c) => c.suit)).size !== 1) return null;
  const ranks = cards.map((c) => c.rank);
  if (new Set(ranks).size !== 5 || !areConsecutive(ranks)) return null;
  return { type: "straight_flush", cards: [...cards], primaryRank: Math.max(...ranks), bombSize: 0 };
};

const checkFullHouse = (cards: readonly Card[]): Combo | null => {
  if (cards.length !== 5 || cards.some(isJoker)) return null;
  const counts = rankCounts(cards);
  const vals = [...counts.values()].sort((a, b) => a - b);
  if (vals.length !== 2 || vals[0] !== 2 || vals[1] !== 3) return null;
  let tripleRank = 0;
  for (const [r, cnt] of counts) if (cnt === 3) tripleRank = r;
  return { type: "triple_plus_pair", cards: [...cards], primaryRank: tripleRank, bombSize: 0 };
};

const checkConsecutivePairs = (cards: readonly Card[]): Combo | null => {
  if (cards.length !== 6 || cards.some(isJoker)) return null;
  const counts = rankCounts(cards);
  if (counts.size !== 3 || ![...counts.values()].every((v) => v === 2)) return null;
  const ranks = [...counts.keys()];
  if (!areConsecutive(ranks)) return null;
  return { type: "consecutive_pairs", cards: [...cards], primaryRank: Math.max(...ranks), bombSize: 0 };
};

const checkConsecutiveTriples = (cards: readonly Card[]): Combo | null => {
  if (cards.length !== 6 || cards.some(isJoker)) return null;
  const counts = rankCounts(cards);
  if (counts.size !== 2 || ![...counts.values()].every((v) => v === 3)) return null;
  const ranks = [...counts.keys()];
  if (!areConsecutive(ranks)) return null;
  return { type: "consecutive_triples", cards: [...cards], primaryRank: Math.max(...ranks), bombSize: 0 };
};

/**
 * Power tier for bomb ordering (combinations.py _bomb_power). Surprising part:
 * a straight flush beats a 5-of-a-kind but NOT a 6-of-a-kind.
 *   4-of-kind=1, 5-of-kind=2, straight flush=3, 6-of-kind=4, 7=5, 8=6, ...
 */
const bombPower = (bomb: Combo): number => {
  if (bomb.type === "straight_flush") return 3;
  if (bomb.bombSize <= 5) return bomb.bombSize - 3; // 4->1, 5->2
  return bomb.bombSize - 2; // 6->4, 7->5, ...
};

const bombBeats = (a: Combo, b: Combo): boolean => {
  const pa = bombPower(a);
  const pb = bombPower(b);
  if (pa !== pb) return pa > pb;
  return (a.primaryRank ?? 0) > (b.primaryRank ?? 0);
};

/**
 * Does combo `a` beat combo `b`? Mirrors Combination.beats in combinations.py.
 * PASS never beats and is always beaten. Bombs beat non-bombs; two bombs use the
 * bomb hierarchy. Same type requires equal card count; higher primary rank wins.
 */
export const beats = (a: Combo, b: Combo): boolean => {
  if (a.type === "pass") return false;
  if (b.type === "pass") return true;

  const aBomb = isBomb(a);
  const bBomb = isBomb(b);
  if (aBomb && !bBomb) return true;
  if (!aBomb && bBomb) return false;
  if (aBomb && bBomb) return bombBeats(a, b);

  if (a.type !== b.type) return false;
  if (a.cards.length !== b.cards.length) return false;

  const ar = a.primaryRank ?? 0;
  const br = b.primaryRank ?? 0;
  if (ar !== br) return ar > br;
  // Same primary rank: big joker single beats small joker single.
  if (a.type === "single" && ar === RANK.JOKER) {
    return a.cards[0].suit === "BJ" && b.cards[0].suit === "SJ";
  }
  return false;
};
