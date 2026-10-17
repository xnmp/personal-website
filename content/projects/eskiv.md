---
slug: eskiv
glyph: 避
title: Eskiv
heading: A brute-force AI that plays a dodger.
href: /p/eskiv
repo: 'https://github.com/xnmp/Eskiv_new'
tags:
  - python
  - pygame
  - brute-force
  - '10,000 games'
index: '2016 game, 2026 analysis · how it walks, stands, and dies'
stats:
  - '10,000 games'
  - n_hit = 0
  - 16.4M steps
art: /screens/eskiv.png
status: complete
shelf: games
tone: olive
metadata:
  title: 'Eskiv: a brute-force AI that plays a dodger'
  description: >-
    A dodger game and its brute-force AI. 10,000 games, three questions, three
    plates: path ratio vs clutter, where the agent stands, and how it dies.
order: 11
---
<!-- block: all-projects -->
← all projects

<!-- block: headline -->
A brute-force AI that plays a dodger.

<!-- block: eskiv-is-a-2016-game-you-move-a-square-dodge-balls-grab-a -->
Eskiv is a 2016 game: you move a square, dodge balls, grab a new square each tick. Every pickup spawns another ball, so the field fills up until the agent can’t find a safe path home. Ten thousand games, one brute-force agent with `lookahead=100`, three plates of how it behaves.

<!-- block: python -->
python

<!-- block: pygame -->
pygame

<!-- block: brute-force-search -->
brute-force search

<!-- block: game-from-2016 -->
game from 2016

<!-- block: the-game -->
The game

<!-- block: what-you-re-watching -->
What you’re watching

<!-- block: figure-fig-0-one-game-played-at-speed -->
FIG. 0 · One game, played at speed

<!-- block: caption-a-recording-of-the-brute-force-agent-playing-on-yo -->
A recording of the brute-force agent playing, on YouTube (about 10 minutes).

<!-- block: label-watch-the-run -->
Watch the run

<!-- block: the-large-square-is-the-player -->
The large square is the player. The circles are enemies; they bounce and accelerate, and there are more of them every second. Small squares are pickups worth one point each. (In the recording the player is grey, the enemies blue and the pickups light grey.) The agent searches over reachable pickup targets and picks the one whose safe-neighbourhood survives the next hundred ticks of simulation. When no such target exists, the game ends.

<!-- block: the-setup -->
The setup

<!-- block: 10-000-games-three-questions -->
10,000 games, three questions

<!-- block: the-engine-was-rewritten-headless-vectorised-enemies-no-py -->
The engine was rewritten headless (vectorised enemies, no pygame in the hot loop), so ten thousand 5-minute games finish in an afternoon. Every frame of every game is saved. Three questions, chosen because I was curious and the answers weren’t obvious from watching one game:

<!-- block: does-the-agent-move-in-straight-lines -->
**Does the agent move in straight lines?** How close to the shortest route does it actually walk, and does that change as the field gets crowded?

<!-- block: where-does-it-spend-its-time -->
**Where does it spend its time?** Does a brute-force agent with no notion of “danger zones” still discover them empirically?

<!-- block: how-does-it-die -->
**How does it die?** Is it mostly clipped by fast enemies, or does it trap itself in corners when the field fills up?

<!-- block: path-ratio -->
Path ratio

<!-- block: path-ratio-vs-clutter -->
Path ratio vs clutter

<!-- block: straight-line-distance-divided-by-actual-path-walked-per-p -->
Straight-line distance divided by actual path walked, per pickup. 1.0 means the agent walked a straight line. Bucketed by how many balls were on the field at the time.

<!-- block: figure-fig-1-742-146-pickups-across-10-000-games -->
FIG. 1 · 742,146 pickups across 10,000 games

<!-- block: caption-mean-ratio-line-interquartile-range-band-sample-co -->
Mean ratio (line), interquartile range (band), sample count (bars).

<!-- block: with-an-empty-field-the-agent-walks-at-76-of-the-straight -->
With an empty field the agent walks at ~76% of the straight line, not 100%, because it’s already dodging a few enemies. By the time there are 60+ balls it’s down to 40%, and at 100+ it’s taking routes more than four times longer than the crow flies. The fall-off is smooth and roughly linear from ~20 balls onward. Not surprising, but this is the shape of the concession.

<!-- block: where-it-stands -->
Where it stands

<!-- block: where-the-agent-stands -->
Where the agent stands

<!-- block: player-position-density-by-score-bucket -->
Player-position density by score bucket. Log-smoothed, 16.4 million samples. Auto-scrubs through the game’s life.

<!-- block: figure-fig-2-12-score-buckets-smoothed-density -->
FIG. 2 · 12 score buckets, smoothed density

<!-- block: caption-top-left-is-the-top-left-corner-of-the-game-field -->
Top-left is the top-left corner of the game field. Watch it crawl to the walls.

<!-- block: up-to-about-200-points-the-agent-hugs-the-centre-which-giv -->
Up to about 200 points the agent hugs the centre, which gives maximum optionality and minimum wall risk. Somewhere between 300 and 400 it flips: the centre becomes so ball-dense that the only safe pockets are against the edges. By the time scores hit 500 it’s spending most of its steps pinned to a single wall. Nobody told the agent to do this. It’s where an agent that only minimises immediate risk ends up.

<!-- block: how-it-dies -->
How it dies

<!-- block: how-it-dies-2 -->
How it dies

<!-- block: final-score-per-game -->
Final score per game. Brute agent, `lookahead=100`, small field.

<!-- block: figure-fig-3-10-000-games-mean-381-1-median-385 -->
FIG. 3 · 10,000 games · mean 381.1 · median 385

<!-- block: caption-every-death-was-by-trap-zero-deaths-by-direct-hit -->
Every death was by trap; zero deaths by direct hit.

<!-- block: the-distribution-is-tight-stddev-58-p10-p90-range-of-310-4 -->
The distribution is tight: stddev 58, p10–p90 range of ~310–445. More striking, **not a single game** ended by getting hit. Every death was a trap, with the search raising `DeathError` because no target had a safe enough 100-step future. The agent dodges perfectly right up until it corners itself, a very specific failure mode of conservative search.

<!-- block: the-rough-edges -->
The rough edges

<!-- block: open-questions -->
Open questions

<!-- block: if-the-agent-never-gets-hit-it-s-over-spending-its-lookahe -->
If the agent never gets hit, it’s over-spending its lookahead on safety. What’s the smallest lookahead that preserves the `n_hit=0` property, and does the score distribution stay this tight?

<!-- block: the-corner-stickiness-in-late-game-emerges-without-being-d -->
The corner-stickiness in late game emerges without being designed in. Would an RL agent (DQN, PPO) discover the same strategy, or does the value function let it take risks a brute search won’t?

<!-- block: label-open-question-ii -->
Open question II

<!-- block: the-path-ratio-curve-bends-smoothly-through-20-balls -->
The path-ratio curve bends smoothly through ~20 balls. Is there a principled ball-density above which straight-line motion is provably unsafe, like a critical percolation threshold for a moving agent?

<!-- block: label-open-question-iii -->
Open question III

<!-- block: materialspython-numpy-scipy-pygame -->
Materials**Python, NumPy, SciPy, pygame**

<!-- block: vintage2016-analysis-2026 -->
Vintage**2016, analysis 2026**

<!-- block: scale10-000-games-16 -->
Scale**10,000 games · 16.4M steps · 742k pickups**

<!-- block: source-github-xnmp-eskiv-new-https-github -->
Source **[github/xnmp/Eskiv_new ](https://github.com/xnmp/Eskiv_new)**

<!-- block: window-title-1 -->
Eskiv: brute-force AI playthrough
