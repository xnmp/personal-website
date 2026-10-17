---
slug: automatedspike
glyph: 法
title: AutomatedSpike
heading: 'Looking for Magic decks nobody has built yet, and agents that can pilot them.'
href: /p/automatedspike
tags:
  - python
  - reinforcement learning
  - xmage
  - mtg
index: MTG Modern deck search + RL pilots · confidence-gated results
stats:
  - 800-game check
  - 95% vs naive
  - 72 test files
art: /screens/automatedspike.png
status: producing
shelf: games
tone: amber
metadata:
  title: 'AutomatedSpike: Magic decks nobody has built yet'
  description: >-
    Research into finding inventive Magic: The Gathering Modern decks and
    training agents to pilot them. So far it works on a restricted starter pool,
    with confidence bounds on every claim and a list of what failed.
order: 9
---
<!-- block: all-projects -->
← all projects

<!-- block: headline -->
Looking for Magic decks nobody has built yet, and agents that can pilot them.

<!-- block: this-is-research-into-finding-inventive-decks-for-magic-th -->
This is research into finding inventive decks for Magic: The Gathering Modern, and into training agents that can actually play them. You cannot tell whether a new deck is good until something plays it well, so the two problems have to be solved together.

<!-- block: full-modern-is-not-working-yet -->
Full Modern is not working yet. The card pool the engine supports today is Plains and nine vanilla creatures. Everything below is true inside that small world.

<!-- block: python -->
python

<!-- block: xmage -->
xmage

<!-- block: argentum -->
argentum

<!-- block: behaviour-cloning -->
behaviour cloning

<!-- block: reinforcement-learning -->
reinforcement learning

<!-- block: the-shape -->
The shape

<!-- block: brewer-pilot-evaluator-environment -->
Brewer, pilot, evaluator, environment

<!-- block: from-docs-mission-and-architecture -->
From `docs/mission-and-architecture.md` and the layout of `src/automated_spike/`.

<!-- block: four-parts-with-separate-jobs -->
Four parts with separate jobs. The brewer proposes legal deck changes. The pilot chooses actions from what a player is allowed to see. The evaluator schedules games, computes uncertainty and decides whether a result counts. The environment runs the rules and produces replays. The package mirrors that: `brewer`, `pilot`, `evaluation`, `environment`, `domain`, `corpus` and `infrastructure`.

<!-- block: two-rules-from-the-design-matter-most -->
Two rules from the design matter most. The brewer cannot change the evaluation criteria after seeing results, and the pilot never receives engine state or the opponent’s hand, only an immutable observation.

<!-- block: two-real-engines-are-pinned-next-to-the-python-xmage-and-a -->
Two real engines are pinned next to the Python: XMage and Argentum, both built locally under `integrations/`. On a panel of 202 card names from twelve real decks, XMage had 191 by exact name and Argentum had 103, so XMage is the one I am qualifying for Modern. Argentum stays as a smaller comparator. I also found it accepting illegal damage underassignment in a fixture, which is recorded in `argentum-pinned-audit.md`.

<!-- block: the-starter-engine -->
The starter engine

<!-- block: small-on-purpose-and-strict-about-it -->
Small on purpose, and strict about it

<!-- block: until-an-upstream-engine-could-run-here-i-wrote-a-starter -->
Until an upstream engine could run here I wrote a starter engine in Python. It implements the real rules that apply to its pool: priority, the stack, explicit mana payment, London mulligans, summoning sickness, full attack and block declarations, arbitrary legal damage assignment, and state-based actions. Anything outside the whitelist is rejected when the game resets.

<!-- block: it-is-deterministic -->
It is deterministic. Every game saves its action transcript and observation hashes, and a replay re-executes the actions against the engine to check them. The audit of the main confirmation run reproduced 800 of 800 engine transcripts and 800 of 800 policy reruns.

<!-- block: the-pilots -->
The pilots

<!-- block: a-teacher-then-a-student -->
A teacher, then a student

<!-- block: the-teacher-is-a-heuristic-pilot-in-pilot-heuristics -->
The teacher is a heuristic pilot in `pilot/heuristics.py`. It estimates public damage clocks, keeps blockers back against a lethal counterattack, splits damage among multiple blockers, chooses affordable spells and keeps playable opening hands.

<!-- block: the-student-learns-combat-only -->
The student learns combat only. It is a 44-feature linear softmax policy over complete combat proposals, first trained by behaviour cloning on 32 teacher games, then updated with REINFORCE for four batches of 16 games. Hands and spell sequencing still come from the teacher.

<!-- block: figure-fig-1-the-teacher-against-two-weak-baselines -->
FIG. 1 · the teacher against two weak baselines

<!-- block: caption-from-docs-experiments-starter-prototype-md-win-1-d -->
From docs/experiments/starter-prototype.md. Win = 1, draw = 0.5, loss = 0. No draws, errors or truncations occurred.

<!-- block: code-800-game-check-frozen-heuristic-teacher-hoeffding-low -->
```
800-game check, frozen heuristic teacher
(Hoeffding lower bounds, simultaneous)

                 opponent   wins / n    lower
  24 Plains      random     200 / 200   0.880
  24 Plains      naive      190 / 200   0.830
  26 Plains      random     200 / 200   0.880
  26 Plains      naive      184 / 200   0.800

gate: lower bound > 0.55 in every stratum  -> passed
```

<!-- block: the-evidence-rules -->
The evidence rules

<!-- block: declare-the-test-before-you-run-it -->
Declare the test before you run it

<!-- block: evaluation-statistics -->
`evaluation/statistics.py`, `evaluation/promotion.py`.

<!-- block: each-experiment-fixes-its-seeds-decks-opponents-game-count -->
Each experiment fixes its seeds, decks, opponents, game count and source files before any confirmation game. The bounds are Hoeffding intervals on the score, which are conservative: with 200 games and the alpha split across four strata, a perfect run gets a lower bound of 0.880 and not 1.0.

<!-- block: the-alpha-budget-is-0 -->
The alpha budget is `0.05 / [k(k+1)]` for attempt `k`, and attempts are recorded in a SQLite ledger before the games start. A failed or interrupted run still uses its attempt, so I cannot retry until it looks good. Any technical failure in a game voids the run, and no game may be dropped. Passing the statistics is not enough either; the protocol also requires an independent review of rules behaviour and hidden-information separation.

<!-- block: what-failed -->
What failed

<!-- block: the-negative-results -->
The negative results

<!-- block: these-are-the-numbers-i-would-hide-if-i-were-selling-it -->
These are the numbers I would hide if I were selling it.

<!-- block: figure-fig-2-the-first-learning-run-against-the-teacher -->
FIG. 2 · the first learning run against the teacher

<!-- block: caption-304-games-no-technical-outcomes-wins-out-of-16-per -->
304 games, no technical outcomes. Wins out of 16 per cell, pooled over two deck mirrors. Source: starter-prototype.md.

<!-- block: code-learned-combat-student-304-games-16-per-cell-random-n -->
```
learned combat student, 304 games, 16 per cell

                       random  naive  teacher
  untrained scorer      15/16   5/16    0/16
  behaviour cloning     16/16  12/16    3/16
  + 4 RL batches        16/16  13/16    4/16
```

<!-- block: rl-won-4-of-16-against-the-teacher -->
**RL won 4 of 16 against the teacher.** Cloning alone won 3 of 16. With 8 games per stratum even a perfect score only has a lower bound of 0.345, so the doc says RL is not shown to be better than cloning. The later guarded model won 45 of 64 against the teacher in a 256-game paired comparison, but the paper trail says uncertainty still prevents a strength claim.

<!-- block: the-first-brewing-search-found-nothing -->
**The first brewing search found nothing.** It played 280 games over six legal deck mutations plus the original. The best, swapping a Pillarfield Ox for a Plains, scored 60.0% against 52.5% for the reference, but the simultaneous bounds on the difference were about -0.72 to +0.87. `confirmed_improvement` stayed false.

<!-- block: a-tactical-gate-failed -->
**A tactical gate failed.** A fresh set of 48 board positions came back 42 of 48, 34 of 40 on the critical cases. Three new attack and block positions failed in both seats, and the 800-game confirmation I had planned was deferred. A corrective guard on combat then passed 48 of 48 new cases and the 800-game check (187/200 and 180/200 against naive, 400/400 against random), but it carries no claim of beating the teacher.

<!-- block: a-tactical-rewrite-did-not-move-scores -->
**A tactical rewrite did not move scores.** A 16-game comparison of a native XMage pilot with search over combat declarations scored the same as the original teacher against every opponent tested. It fixed specific positions, and it did not change a result.

<!-- block: the-corpus -->
The corpus

<!-- block: real-decks-partly-collected -->
Real decks, partly collected

<!-- block: all-135-modern-archetype-pages-were-fetched-and-normalised -->
All 135 Modern archetype pages were fetched and normalised into 143 unique deck compositions. Of the 3,556 constituent deck URLs they list, 3,555 are still queued and one was blocked with HTTP 403.

<!-- block: label-goldfish-snapshot -->
Goldfish snapshot

<!-- block: raw-bytes-are-stored-requests-respect-robots -->
Raw bytes are stored, requests respect robots.txt and wait two seconds apart, and a card name only resolves through an evidenced alias. Ten quarantined captures were recovered with three exact-name lookups.

<!-- block: label-provenance -->
Provenance

<!-- block: the-moxfield-profile-hit-a-cloudflare-block-youtube-discov -->
The Moxfield profile hit a Cloudflare block, YouTube discovery needs credentials I have not configured, and Spike discovery is incomplete.

<!-- block: label-gaps -->
Gaps

<!-- block: where-it-stands -->
Where it stands

<!-- block: full-modern-is-still-ahead -->
Full Modern is still ahead

<!-- block: counts-are-from-docs-implementation-status -->
Counts are from `docs/implementation-status.md`, observed 6 October 2026.

<!-- block: the-restricted-starter-engine-is-qualified-and-so-are-two -->
The restricted starter engine is qualified, and so are two starter pilots, the heuristic and the guarded learned one. Nothing here shows a pilot that beats the teacher, an improved deck, or competence on Modern. The status document says so directly: no broadly qualified Modern engine, no confirmed strength advancement, no confirmed deck improvement, and no complete corpus.

<!-- block: a-separate-xmage-pilot-also-plays-the-starter-pool-plus-re -->
A separate XMage pilot also plays the starter pool plus Rebuke, which is the first instant-speed interaction in the project. It runs real XMage games, one of which lasted 108 turns. The tests are standard-library Python, 72 `test_*.py` files in `tests/`.

<!-- block: does-any-of-this-transfer -->
Does any of this transfer? The 800-game gate says the pilot is competent against two weak baselines on a tiny pool. Whether the same approach works once there are instants, many colours and a sideboard is what the next engine work has to answer.

<!-- block: materialspython-xmage-argentum-sqlite -->
Materials**Python, XMage, Argentum, SQLite**

<!-- block: vintageoctober-2026 -->
Vintage**October 2026**

<!-- block: statusactive-research-restricted-pool -->
Status**Active research, restricted pool**

<!-- block: sourceprivate -->
Source**private**
