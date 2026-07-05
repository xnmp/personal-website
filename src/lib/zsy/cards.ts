/**
 * Card and deck representation for Zheng Shang You.
 *
 * Mirrors src/zsy/cards.py. v1 simplifications: single 54-card deck,
 * no wildcards, no dynamic "high card" / supreme-rank mechanic. Rank
 * ordering therefore reduces to raw rank value (3 lowest ... 2 highest
 * standard), with jokers above 2 (small < big).
 */

// Standard ranks are 0..12 (THREE..TWO); JOKER is 13. Ordering matches
// cards.py Rank IntEnum where THREE=0 and TWO=12 (2 is the highest
// non-joker rank).
export const RANK = {
  THREE: 0,
  FOUR: 1,
  FIVE: 2,
  SIX: 3,
  SEVEN: 4,
  EIGHT: 5,
  NINE: 6,
  TEN: 7,
  JACK: 8,
  QUEEN: 9,
  KING: 10,
  ACE: 11,
  TWO: 12,
  JOKER: 13,
} as const;

export type Rank = number;

export const RANK_SYMBOLS: Record<number, string> = {
  0: "3", 1: "4", 2: "5", 3: "6", 4: "7", 5: "8", 6: "9",
  7: "10", 8: "J", 9: "Q", 10: "K", 11: "A", 12: "2", 13: "★",
};

// Suits. Four standard suits plus the two joker "suits" that distinguish
// the small and big joker (both share rank JOKER). Order matches cards.py
// Suit IntEnum: H < D < C < S < SJ < BJ.
export type Suit = "H" | "D" | "C" | "S" | "SJ" | "BJ";

export const STANDARD_SUITS: readonly Suit[] = ["H", "D", "C", "S"];
const SUIT_ORDER: Record<Suit, number> = { H: 0, D: 1, C: 2, S: 3, SJ: 4, BJ: 5 };

export const SUIT_SYMBOLS: Record<Suit, string> = {
  H: "♥", D: "♦", C: "♣", S: "♠", SJ: "SJ", BJ: "BJ",
};

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

// Standard ranks THREE..TWO (excludes the joker pseudo-rank).
export const STANDARD_RANKS: readonly Rank[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const SMALL_JOKER: Card = { rank: RANK.JOKER, suit: "SJ" };
export const BIG_JOKER: Card = { rank: RANK.JOKER, suit: "BJ" };

export const isJoker = (c: Card): boolean => c.rank === RANK.JOKER;

/** Stable unique key for a card. In a single deck every (rank,suit) is unique. */
export const cardKey = (c: Card): string => `${c.rank}-${c.suit}`;

export const cardEquals = (a: Card, b: Card): boolean =>
  a.rank === b.rank && a.suit === b.suit;

export const cardLabel = (c: Card): string => {
  if (c.suit === "SJ") return "SmallJoker";
  if (c.suit === "BJ") return "BigJoker";
  return `${RANK_SYMBOLS[c.rank]}${SUIT_SYMBOLS[c.suit]}`;
};

/** Total order over cards: by rank, then suit (mirrors Card.__lt__ in cards.py). */
export const compareCards = (a: Card, b: Card): number =>
  a.rank !== b.rank ? a.rank - b.rank : SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];

export const sortCards = (cards: readonly Card[]): Card[] =>
  [...cards].sort(compareCards);

/** Build one 54-card deck: 52 standard cards + small + big joker. */
export const buildDeck = (): Card[] => {
  const cards: Card[] = [];
  for (const rank of STANDARD_RANKS) {
    for (const suit of STANDARD_SUITS) cards.push({ rank, suit });
  }
  cards.push(SMALL_JOKER, BIG_JOKER);
  return cards;
};

/** mulberry32 PRNG: deterministic 32-bit seeded generator returning [0,1). */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Fisher-Yates shuffle. Deterministic when `seed` is provided (mulberry32),
 * otherwise uses Math.random. Returns a new array.
 */
export const shuffle = (cards: readonly Card[], seed?: number): Card[] => {
  const out = [...cards];
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Deal all cards round-robin to `numPlayers`. Lower indices receive the
 * extra cards when the deck does not divide evenly (mirrors Deck.deal in
 * cards.py). For 4 players over 54 cards this yields 14/14/13/13.
 */
export const deal = (cards: readonly Card[], numPlayers: number): Card[][] => {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  cards.forEach((card, i) => hands[i % numPlayers].push(card));
  return hands;
};
