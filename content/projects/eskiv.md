---
slug: eskiv
glyph: 避
title: Eskiv
summary: "A game from high school, and the bot I wrote for it during Covid."
heading: "A game from high school"
href: /p/eskiv
repo: 'https://github.com/xnmp/Eskiv_new'
tags:
  - python
  - pygame
  - "lookahead search"
  - "game analysis"
index: "A game from high school · recreated during Covid · search-based bot"
stats:
  - "Search-based bot"
  - "100-step lookahead"
  - "10,000-game analysis"
art: /screens/eskiv.png
status: complete
shelf: games
tone: olive
metadata:
  title: "Eskiv · chong"
  description: "I recreated Eskiv during Covid and wrote a search-based bot for it. Later I looked at how it moved and why its runs ended."
order: 11
---

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
A game from high school

<!-- block: eskiv-is-a-2016-game-you-move-a-square-dodge-balls-grab-a -->
We used to play Eskiv in high school. During Covid I recreated it and wrote a bot that got pretty good at it. This was before I was using coding agents; the game and bot were my own work.

It's different from the learning agents elsewhere on this site. This one looks ahead through possible moves and chooses somewhere it thinks it can survive.

<!-- block: python -->
python

<!-- block: pygame -->
pygame

<!-- block: brute-force-search -->
lookahead search

<!-- block: game-from-2016 -->
recreated during Covid

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
The large square is the player, the circles are enemies and the small squares are pickups. As more balls fill the field, getting to a pickup safely becomes harder. The bot looks a hundred ticks ahead. If it can't find a target with a safe enough future, the run ends.

<!-- block: the-setup -->
Looking back at the bot

<!-- block: 10-000-games-three-questions -->
What is it actually doing?

<!-- block: body-what-is-it-actually-doing -->
Later I made a headless version and ran 10,000 games, recording the frames. Watching a run gives a feel for it, but I wanted to look at a few things across many games:

1. **Does the agent move in straight lines?** How close to the shortest route does it actually walk, and does that change as the field gets crowded?
2. **Where does it spend its time?** Does a brute-force agent with no notion of “danger zones” still discover them empirically?
3. **How does it die?** Is it mostly clipped by fast enemies, or does it trap itself in corners when the field fills up?

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
Even early on, the bot takes detours around enemies. As the field gets crowded, the paths become much longer. With over a hundred balls, a pickup can require a route more than four times the direct distance.

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
It spends the early part of a run near the centre, then moves towards the walls as the middle fills up. At high scores it often stays near one edge. There's no explicit instruction to hug a wall; that pattern comes out of the search.

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
In these 10,000 runs, every ending was recorded as a trap, not a direct hit. The search ran out of targets it considered safe before a ball collided with the player. So the zero-hit count says something about how the bot stops, as well as how it dodges.

<!-- block: the-rough-edges -->
Things I'm curious about

<!-- block: open-questions -->
How cautious does it need to be?

<!-- block: body-how-cautious-does-it-need-to-be -->
### Open question

A hundred ticks of lookahead may be more caution than it needs. I'd be interested to see how the scores change with a shorter horizon, including whether it starts ending through collisions instead.

### Open question II

I'd also like to compare it with a learned policy. Would it end up on the same walls, or take risks this search rules out?

### Open question III

The routes get steadily more indirect as balls accumulate. I wonder how much of that is unavoidable and how much belongs to this particular bot.

<!-- block: materialspython-numpy-scipy-pygame -->
Materials**Python, NumPy, SciPy, pygame**

<!-- block: vintage2016-analysis-2026 -->
When**Recreated during Covid · analysis in 2026**

<!-- block: scale10-000-games-16 -->
Scale**10,000 games · 16.4M steps · 742k pickups**

<!-- block: source-github-xnmp-eskiv-new-https-github -->
Source **[github/xnmp/Eskiv_new ](https://github.com/xnmp/Eskiv_new)**

<!-- block: window-title-1 -->
Eskiv: brute-force AI playthrough
