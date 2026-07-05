/**
 * Game state and trick resolution for Zheng Shang You.
 *
 * Mirrors the semantics of src/zsy/game.py (Game._apply_move) but as pure,
 * immutable-ish transitions. v1: 4 players, individual (no teams), single
 * 54-card deck, no wildcards.
 *
 * A trick ends when every other still-active player passes consecutively;
 * the trick leader then leads the next trick. A player who empties their hand
 * is recorded in finish order and skipped thereafter. The game ends when 3 of
 * the 4 players have finished (the 4th is the loser).
 */

import { Card, buildDeck, shuffle, deal, sortCards, compareCards, cardKey } from "./cards";
import { Combo, beats, detectCombo } from "./combos";
import { legalMoves } from "./legal";

export type Move = Combo | "pass";

export interface GameState {
  readonly numPlayers: number;
  readonly hands: readonly (readonly Card[])[];
  readonly currentPlayer: number;
  /** Active combo to beat; null on a fresh trick (leader to play). */
  readonly lastCombo: Combo | null;
  /** Owner of the current trick — leads next once the trick resolves. */
  readonly trickLeader: number;
  /** Consecutive passes since the last non-pass play. */
  readonly passes: number;
  /** Player ids in the order they emptied their hands. */
  readonly finished: readonly number[];
  readonly moveCount: number;
}

const NUM_PLAYERS = 4;

const isPass = (m: Move): m is "pass" | (Combo & { type: "pass" }) =>
  m === "pass" || m.type === "pass";

/** Index of the player holding the globally lowest card (first-leader convention). */
const lowestCardHolder = (hands: readonly (readonly Card[])[]): number => {
  let best = 0;
  let bestCard: Card | null = null;
  hands.forEach((hand, p) => {
    for (const c of hand) {
      if (bestCard === null || compareCards(c, bestCard) < 0) {
        bestCard = c;
        best = p;
      }
    }
  });
  return best;
};

/**
 * Deal a new game. Deterministic when `seed` is given. First leader is the
 * holder of the lowest dealt card (3♥ is always present in a full deck).
 */
export const newGame = (seed?: number): GameState => {
  const hands = deal(shuffle(buildDeck(), seed), NUM_PLAYERS).map((h) => sortCards(h));
  const leader = lowestCardHolder(hands);
  return {
    numPlayers: NUM_PLAYERS,
    hands,
    currentPlayer: leader,
    lastCombo: null,
    trickLeader: leader,
    passes: 0,
    finished: [],
    moveCount: 0,
  };
};

export const isOver = (state: GameState): boolean =>
  state.finished.length >= state.numPlayers - 1;

/** Full ranking: finish order followed by any not-yet-finished player. */
export const rankings = (state: GameState): number[] => {
  const out = [...state.finished];
  for (let p = 0; p < state.numPlayers; p++) if (!out.includes(p)) out.push(p);
  return out;
};

const removeCards = (hand: readonly Card[], cards: readonly Card[]): Card[] => {
  const toRemove = new Set(cards.map(cardKey));
  const out: Card[] = [];
  for (const c of hand) {
    const k = cardKey(c);
    if (toRemove.has(k)) toRemove.delete(k);
    else out.push(c);
  }
  if (toRemove.size !== 0) throw new Error("applyMove: cards not present in hand");
  return out;
};

const advance = (hands: readonly (readonly Card[])[], from: number): number => {
  const n = hands.length;
  for (let i = 1; i <= n; i++) {
    const p = (from + i) % n;
    if (hands[p].length > 0) return p;
  }
  return from; // no active players (should not happen)
};

/**
 * Apply a move for the current player, returning the next state. Throws on any
 * illegal move (wrong cards, passing while leading, or failing to beat the
 * active combo).
 */
export const applyMove = (state: GameState, move: Move): GameState => {
  if (isOver(state)) throw new Error("applyMove: game already over");
  const cur = state.currentPlayer;
  const hand = state.hands[cur];
  if (hand.length === 0) throw new Error("applyMove: current player has no cards");

  const hands = state.hands.map((h) => [...h]) as Card[][];
  let lastCombo = state.lastCombo;
  let trickLeader = state.trickLeader;
  let passes = state.passes;
  const finished = [...state.finished];

  if (isPass(move)) {
    if (state.lastCombo === null) throw new Error("applyMove: cannot pass while leading");
    passes += 1;
  } else {
    const combo = detectCombo(move.cards);
    if (combo === null) throw new Error("applyMove: not a valid combination");
    if (state.lastCombo !== null && !beats(combo, state.lastCombo)) {
      throw new Error("applyMove: move does not beat the active combo");
    }
    hands[cur] = removeCards(hand, combo.cards);
    lastCombo = combo;
    trickLeader = cur;
    passes = 0;
    if (hands[cur].length === 0 && !finished.includes(cur)) finished.push(cur);
  }

  // Trick resolution — mirrors game.py: the trick ends once every active player
  // other than the leader has passed.
  const activeCount = hands.filter((h) => h.length > 0).length;
  const leaderHasCards = hands[trickLeader].length > 0;
  const others = activeCount - (leaderHasCards ? 1 : 0);

  let currentPlayer: number;
  if (passes >= others) {
    lastCombo = null;
    passes = 0;
    currentPlayer = leaderHasCards ? trickLeader : advance(hands, trickLeader);
  } else {
    currentPlayer = advance(hands, cur);
  }

  // If only one active player remains, the game is over: append the rest.
  if (activeCount <= 1) {
    for (let p = 0; p < state.numPlayers; p++) if (!finished.includes(p)) finished.push(p);
  }

  return {
    ...state,
    hands,
    currentPlayer,
    lastCombo,
    trickLeader,
    passes,
    finished,
    moveCount: state.moveCount + 1,
  };
};

/** Legal non-pass plays for the current player. */
export const currentLegalMoves = (state: GameState): Combo[] =>
  legalMoves(state.hands[state.currentPlayer], state.lastCombo);
