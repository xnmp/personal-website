"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Card,
  type Combo,
  type GameState,
  type Move,
  applyMove,
  beats,
  chooseMove,
  detectCombo,
  isOver,
  newGame,
  rankings,
  sortCards,
} from "@/lib/zsy";

const SEAT_NAMES = ["You", "West", "North", "East"] as const;
const HUMAN = 0;
const AI_DELAY_MS = 700;

const RANK_LABEL = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
const SUIT_GLYPH: Record<string, string> = { H: "♥", D: "♦", C: "♣", S: "♠" };

function cardId(c: Card): string {
  return `${c.rank}-${c.suit}`;
}

function comboPhrase(combo: Combo): string {
  const n = combo.cards.length;
  const rank =
    combo.primaryRank !== null && combo.primaryRank < 13
      ? RANK_LABEL[combo.primaryRank]
      : "jokers";
  switch (combo.type) {
    case "single":
      return `a ${rank}`;
    case "pair":
      return `a pair of ${rank}s`;
    case "triple":
      return `three ${rank}s`;
    case "triple_plus_pair":
      return `a full house on ${rank}s`;
    case "straight":
      return `a ${n}-card straight to ${rank}`;
    case "consecutive_pairs":
      return `${n / 2} consecutive pairs to ${rank}s`;
    case "consecutive_triples":
      return `${n / 3} consecutive triples to ${rank}s`;
    case "straight_flush":
      return `a straight flush to ${rank}`;
    case "bomb":
      return `a ${n}-card bomb of ${rank}s`;
    default:
      return "something unusual";
  }
}

function CardFace({ card }: { card: Card }) {
  if (card.suit === "SJ" || card.suit === "BJ") {
    const big = card.suit === "BJ";
    return (
      <span className={`zsy-card joker`} aria-hidden>
        <span className="corner">{big ? "★" : "✶"}</span>
        <span className="pip">{big ? "★" : "✶"}</span>
      </span>
    );
  }
  const red = card.suit === "H" || card.suit === "D";
  return (
    <span className={`zsy-card ${red ? "red" : "black"}`} aria-hidden>
      <span className="corner">
        {RANK_LABEL[card.rank]}
        {"\n"}
        {SUIT_GLYPH[card.suit]}
      </span>
      <span className="pip">{SUIT_GLYPH[card.suit]}</span>
    </span>
  );
}

function cardName(c: Card): string {
  if (c.suit === "SJ") return "small joker";
  if (c.suit === "BJ") return "big joker";
  const suits: Record<string, string> = {
    H: "hearts",
    D: "diamonds",
    C: "clubs",
    S: "spades",
  };
  return `${RANK_LABEL[c.rank]} of ${suits[c.suit]}`;
}

export function ZsyGame() {
  const [seed, setSeed] = useState(42);
  const [state, setState] = useState<GameState>(() => newGame(42));
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [narration, setNarration] = useState<string>("Cards dealt. Lowest card leads.");

  const over = isOver(state);
  const humanTurn = !over && state.currentPlayer === HUMAN;
  const hand = useMemo(() => sortCards(state.hands[HUMAN]), [state]);

  const selectedCards = useMemo(
    () => hand.filter((c) => selected.has(cardId(c))),
    [hand, selected]
  );

  const selectedCombo = useMemo(
    () => (selectedCards.length ? detectCombo(selectedCards) : null),
    [selectedCards]
  );

  const canPlay =
    humanTurn &&
    selectedCombo !== null &&
    (state.lastCombo === null || beats(selectedCombo, state.lastCombo));

  const canPass = humanTurn && state.lastCombo !== null;

  const narrate = useCallback((player: number, move: Move, next: GameState) => {
    const name = SEAT_NAMES[player];
    if (move === "pass") {
      setNarration(`${name === "You" ? "You pass" : `${name} passes`}.`);
    } else {
      const played = `${name === "You" ? "You play" : `${name} plays`} ${comboPhrase(move)}`;
      const wentOut = next.finished.includes(player) && !next.hands[player].length;
      setNarration(wentOut ? `${played} — and ${name === "You" ? "go" : "goes"} out.` : `${played}.`);
    }
  }, []);

  // Bots act on their turns, one thoughtful beat apart.
  useEffect(() => {
    if (over || state.currentPlayer === HUMAN) return;
    const t = setTimeout(() => {
      const mover = state.currentPlayer;
      const move = chooseMove(state);
      const next = applyMove(state, move);
      narrate(mover, move, next);
      setState(next);
    }, AI_DELAY_MS);
    return () => clearTimeout(t);
  }, [state, over, narrate]);

  const toggle = (c: Card) => {
    if (!humanTurn) return;
    const id = cardId(c);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const play = () => {
    if (!canPlay || !selectedCombo) return;
    const next = applyMove(state, selectedCombo);
    narrate(HUMAN, selectedCombo, next);
    setState(next);
    setSelected(new Set());
  };

  const pass = () => {
    if (!canPass) return;
    const next = applyMove(state, "pass");
    narrate(HUMAN, "pass", next);
    setState(next);
    setSelected(new Set());
  };

  const restart = () => {
    const s = (seed * 48271 + 12345) % 99991 || 7;
    setSeed(s);
    setState(newGame(s));
    setSelected(new Set());
    setNarration("Cards dealt. Lowest card leads.");
  };

  const finalOrder = over ? rankings(state) : null;
  const PLACE = ["i", "ii", "iii", "iv"];
  const medal = (p: number): string => {
    const i = state.finished.indexOf(p);
    return i >= 0 ? PLACE[i] : "";
  };

  return (
    <div className="zsy-table">
      <div className="zsy-opponents">
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            className={`zsy-opp${state.currentPlayer === p && !over ? " active" : ""}${
              state.finished.includes(p) ? " done" : ""
            }`}
          >
            <span>{SEAT_NAMES[p]}</span>
            <span>
              {state.finished.includes(p) ? (
                <span className="medal">out · {medal(p)}</span>
              ) : (
                <span className="n">{state.hands[p].length}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="zsy-trick" aria-live="polite">
        {over && finalOrder ? (
          <div className="zsy-fin">
            <h4>
              {finalOrder[0] === HUMAN
                ? "You went up first."
                : `${SEAT_NAMES[finalOrder[0]]} goes up first.`}
            </h4>
            <ol>
              {finalOrder.map((p, i) => (
                <li key={p}>
                  {PLACE[i]}. {SEAT_NAMES[p]}
                </li>
              ))}
            </ol>
            <button type="button" className="zsy-btn primary" onClick={restart}>
              deal again
            </button>
          </div>
        ) : state.lastCombo ? (
          <>
            <div className="zsy-trick-label">
              on the table — beat it or pass
            </div>
            <div className="zsy-cards">
              {sortCards(state.lastCombo.cards).map((c) => (
                <CardFace key={cardId(c)} card={c} />
              ))}
            </div>
          </>
        ) : (
          <div className="zsy-trick-label">
            fresh trick — <b>{SEAT_NAMES[state.currentPlayer]}</b>{" "}
            {state.currentPlayer === HUMAN ? "lead anything" : "to lead"}
          </div>
        )}
      </div>

      <div className="zsy-hand">
        <div className="zsy-cards" role="group" aria-label="Your hand">
          {hand.map((c) => (
            <button
              key={cardId(c)}
              type="button"
              className={
                c.suit === "SJ" || c.suit === "BJ"
                  ? "zsy-card joker"
                  : `zsy-card ${c.suit === "H" || c.suit === "D" ? "red" : "black"}`
              }
              aria-pressed={selected.has(cardId(c))}
              aria-label={cardName(c)}
              onClick={() => toggle(c)}
              disabled={!humanTurn}
            >
              <span className="corner">
                {c.suit === "SJ" || c.suit === "BJ"
                  ? c.suit === "BJ"
                    ? "★"
                    : "✶"
                  : `${RANK_LABEL[c.rank]}\n${SUIT_GLYPH[c.suit]}`}
              </span>
              <span className="pip">
                {c.suit === "SJ" || c.suit === "BJ"
                  ? c.suit === "BJ"
                    ? "★"
                    : "✶"
                  : SUIT_GLYPH[c.suit]}
              </span>
            </button>
          ))}
        </div>

        <div className="zsy-actions">
          <button
            type="button"
            className="zsy-btn primary"
            onClick={play}
            disabled={!canPlay}
          >
            play{selectedCombo && canPlay ? ` ${comboPhrase(selectedCombo)}` : ""}
          </button>
          <button type="button" className="zsy-btn" onClick={pass} disabled={!canPass}>
            pass
          </button>
          <span className="zsy-status">
            {selectedCards.length > 0 && !selectedCombo
              ? "That isn't a combination."
              : selectedCombo && !canPlay && humanTurn && state.lastCombo
                ? `${comboPhrase(selectedCombo)} doesn't beat the table.`
                : narration}
          </span>
        </div>
      </div>
    </div>
  );
}
