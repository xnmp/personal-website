---
slug: automatedspike
glyph: 法
title: AutomatedSpike
summary: "Seeing what an AI might brew in Magic, and teaching it to play the decks."
heading: "Magic decks I wouldn't think to build"
href: /p/automatedspike
tags:
  - python
  - reinforcement learning
  - xmage
  - mtg
index: "Magic deck search · learned pilots · XMage experiments"
stats:
  - "Deck search"
  - "Learned pilots"
  - "XMage"
art: /screens/automatedspike.png
status: producing
shelf: games
tone: amber
metadata:
  title: "AutomatedSpike · chong"
  description: "I like unusual Magic brews. This project explores deck search and agents that can play the decks well enough to evaluate them."
order: 9
---
<!-- block: all-projects -->
← all projects

<!-- block: headline -->
Magic decks I wouldn't think to build

<!-- block: this-is-research-into-finding-inventive-decks-for-magic-th -->
I've always liked seeing a new Magic brew where the cards fit together in some unexpected way. I wonder what reinforcement learning would come up with: more one-ofs, perhaps, or cards that look wrong until you play enough games with them.

That's the idea behind AutomatedSpike. The difficulty is that to find out whether a deck is good, something has to play it reasonably well. So there's a deck-building problem and a piloting problem tangled together.

<!-- block: full-modern-is-not-working-yet -->
The early experiments below used a tiny pool of Plains and nine vanilla creatures. Later work moved onto XMage and real starter decks. That's still a long way from evaluating arbitrary Modern brews.

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
The pieces

<!-- block: brewer-pilot-evaluator-environment -->
Something to build decks, something to play them

<!-- block: from-docs-mission-and-architecture -->
The project separates the rules, the player, the deck search and the evaluation.

<!-- block: four-parts-with-separate-jobs -->
The brewer proposes a deck change, the pilot plays it, and the evaluator compares the results. The environment handles the game rules and records the replay. Keeping those jobs separate helps when a result looks odd: was it the deck, the player or the engine?

<!-- block: two-rules-from-the-design-matter-most -->
The pilot only gets information a player is allowed to see. The evaluation settings are fixed before a run, so a promising-looking result doesn't change its own test.

<!-- block: two-real-engines-are-pinned-next-to-the-python-xmage-and-a -->
I looked at both XMage and Argentum. XMage covered more of the cards in a sample of real Modern decks, so that became the route beyond the little Python engine. Argentum remains a useful smaller comparison.

<!-- block: the-starter-engine -->
The first version

<!-- block: small-on-purpose-and-strict-about-it -->
Starting with a very small card pool

<!-- block: until-an-upstream-engine-could-run-here-i-wrote-a-starter -->
The Python starter engine only accepts its small whitelist, but within it there are real choices about mana, mulligans, attacks, blocks and damage assignment. It gave the pilot something bounded to learn before dealing with a full card database.

<!-- block: it-is-deterministic -->
Each game saves its actions and observations so I can replay it and check what happened. The early 800-game confirmation run reproduced both the engine transcripts and the policy reruns.

<!-- block: the-pilots -->
The pilots

<!-- block: a-teacher-then-a-student -->
Learning from a scripted player

<!-- block: the-teacher-is-a-heuristic-pilot-in-pilot-heuristics -->
The first teacher is a hand-written player. It estimates damage, keeps blockers back when necessary and chooses spells it can afford. It gives the learning system a starting point.

<!-- block: the-student-learns-combat-only -->
The early student only learned combat. It copied the teacher first, then had a few reinforcement-learning updates. Playing lands and sequencing spells still belonged to the teacher, so these results only describe part of a player.

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
Comparing runs

<!-- block: declare-the-test-before-you-run-it -->
Trying not to fool myself with a good run

<!-- block: evaluation-statistics -->
`evaluation/statistics.py`, `evaluation/promotion.py`.

<!-- block: each-experiment-fixes-its-seeds-decks-opponents-game-count -->
Seeds, decks, opponents and game counts are fixed before confirmation runs. The reported bounds are deliberately conservative, because trying lots of variants makes a lucky result quite easy to find.

<!-- block: the-alpha-budget-is-0 -->
Attempts are recorded before games start, including failures and interruptions. A technical failure voids the run. There are also checks that the rules and hidden-information boundary behaved as intended.

<!-- block: what-failed -->
The early results

<!-- block: the-negative-results -->
Copying the teacher was easier than improving on it

<!-- block: these-are-the-numbers-i-would-hide-if-i-were-selling-it -->
These are the restricted-pool experiments. They were useful for finding what to work on next.

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
The first RL version won 4 of 16 against the teacher; cloning alone won 3 of 16. That sample couldn't distinguish them reliably. A later guarded model did better in another comparison, but there still wasn't enough evidence for the strength claim I wanted to make.

<!-- block: the-first-brewing-search-found-nothing -->
The first deck search didn't establish an improvement either. Replacing a Pillarfield Ox with a Plains looked better in the sample, but the uncertainty was far too wide to know whether it helped.

<!-- block: a-tactical-gate-failed -->
Some new attack and block positions exposed mistakes in both seats, so the planned confirmation run had to wait. Fixing those positions eventually got the guarded player through the starter checks, without showing it was better than the teacher.

<!-- block: a-tactical-rewrite-did-not-move-scores -->
A combat-search rewrite fixed individual positions but didn't change the scores in a small XMage comparison. Another reminder that a sensible code change isn't automatically a stronger player.

<!-- block: the-corpus -->
Real decks

<!-- block: real-decks-partly-collected -->
Collecting things to try

<!-- block: all-135-modern-archetype-pages-were-fetched-and-normalised -->
An early collection pass normalised 135 Modern archetype pages into 143 distinct deck lists. The much larger set of linked deck pages was still mostly queued.

<!-- block: label-goldfish-snapshot -->
Goldfish snapshot

<!-- block: raw-bytes-are-stored-requests-respect-robots -->
The collection keeps the source captures and resolves card names against recorded evidence, so an odd list can be traced back to where it came from.

<!-- block: label-provenance -->
Provenance

<!-- block: the-moxfield-profile-hit-a-cloudflare-block-youtube-discov -->
Some sources were blocked or needed credentials. The collection is incomplete.

<!-- block: label-gaps -->
Gaps

<!-- block: where-it-stands -->
More recently

<!-- block: full-modern-is-still-ahead -->
Moving onto XMage

<!-- block: counts-are-from-docs-implementation-status -->
The later notes are in the 8 October 2026 Arena v1 report.

<!-- block: the-restricted-starter-engine-is-qualified-and-so-are-two -->
Arena v1 plays real starter decks in XMage: Burn, Green Stompy, White Weenie and Black removal. It combines a public-information heuristic player with determinized search. That opens up more interesting deck experiments than the vanilla-creature pool.

<!-- block: a-separate-xmage-pilot-also-plays-the-starter-pool-plus-re -->
The report records a Burn-list improvement of 0.121 in win rate on 3,200 fresh confirmation games. That's a result in that particular experiment, rather than evidence that it can brew or pilot arbitrary Modern decks.

<!-- block: does-any-of-this-transfer -->
What I'd like to see is a deck with an idea I wouldn't have come up with myself, played well enough that I can take the result seriously. That's still the interesting question for me.

<!-- block: materialspython-xmage-argentum-sqlite -->
Materials**Python, XMage, Argentum, SQLite**

<!-- block: vintageoctober-2026 -->
Vintage**October 2026**

<!-- block: statusactive-research-restricted-pool -->
Status**Active research, restricted pool**

<!-- block: sourceprivate -->
Source**private**
