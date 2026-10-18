---
slug: bwai
glyph: 智
title: Brood War
summary: "Trying to train an agent for the game I grew up playing."
heading: "Trying to teach an agent Brood War"
href: /p/bwai
tags:
  - starcraft
  - openbw
  - behaviour cloning
  - "pluto"
index: "Brood War agent · imitation learning · work in progress"
stats:
  - "Protoss vs Protoss"
  - "Behaviour cloning"
  - "Work in progress"
art: /screens/bwai.png
status: producing
shelf: games
tone: cyan
metadata:
  title: "Brood War · chong"
  description: "Brood War was the game I grew up with. These are notes on trying to train an agent for it, including a broken opponent and a reset of the results."
order: 8
---

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
Trying to teach an agent Brood War

<!-- block: i-played-brood-war-competitively-once -->
Brood War is the game I grew up with, and I used to play it fairly competitively. Seeing what learning systems did in StarCraft 2 and Dota 2 made me want to try something along those lines in Brood War too.

This is my attempt, starting with one map and one matchup. So far, a lot of it has been getting the environment and the measurements into a state where I can trust a training result.

<!-- block: openbw -->
openbw

<!-- block: c-pybind11 -->
c++ / pybind11

<!-- block: behaviour-cloning -->
behaviour cloning

<!-- block: stages-0-to-3-done -->
work in progress

<!-- block: before-any-code -->
Getting started

<!-- block: the-feasibility-audit -->
What can I try on one desktop?

<!-- block: body-what-can-i-try-on-one-desktop -->
The first thing in the repo is a feasibility study. AlphaStar-scale training is a long way from what I can run at home. The report helped narrow the starting point to imitation learning from replays, on a small slice of the game.

Before trying a self-play league, I needed to know whether I could run enough games, read the replays and learn anything useful from them. Those became the first stages.

<!-- block: stage-0 -->
Stage 0

<!-- block: stage-0-is-the-engine-fast-enough -->
Can I run enough games?

<!-- block: aggregate-openbw-frames-per-second-by-parallel-instance-co -->
Aggregate OpenBW frames per second by parallel instance count, 12-core desktop.

<!-- block: figure-fig-1-40-000-frames-a-second -->
FIG. 1 · 40,000 frames a second

<!-- block: caption-fig-1-roughly-3-400-games-an-hour-before-gpu-infer -->
The early engine benchmark, before GPU inference entered the loop. It suggested simulation speed wasn't the first thing to worry about.

<!-- block: torchcraft-and-stardata-tooling-were-archived-by-meta-in-2 -->
The old TorchCraft tooling was archived, so the project has its own pybind11 bridge over OpenBW. It reads replays and runs a two-player environment. The replay pipeline accepted 6,770 professional Protoss-versus-Protoss games.

<!-- block: the-vocabulary -->
The vocabulary

<!-- block: recovering-intent-from-replays -->
Turning replay commands into decisions

<!-- block: body-turning-replay-commands-into-decisions -->
A replay records commands, including a lot of selection and bookkeeping. The early setup used a smaller vocabulary: build, train, expand, attack, retreat and so on. A labeler tries to recover those actions from the replay. On an early 200-replay sample, it accounted for 92.7% of commands.

A small model could overfit a cached sample. That was enough to check that the observation and label pipeline carried a learnable signal before spending time on larger training runs.

<!-- block: the-re-baseline -->
A fairly big mistake

<!-- block: my-76-was-measured-against-a-broken-opponent -->
The opponent was broken

<!-- block: sources-current-state -->
Sources: `CURRENT_STATE.md`, `HISTORY.md` (26 and 27 Jul 2026), `DECISION_RECORD.md`.

<!-- block: body-the-opponent-was-broken -->
An earlier model seemed to win about 76% of games against a scripted opponent. Unfortunately, the interpreter running that opponent was wrong, so that result didn't mean what I thought it did.

A filter in the interpreter dropped the script's build-wait instructions. The opponent could put down its first pylon before it had built its fifth probe. Every result against that version needed to be redone.

Against the repaired opponent, the model won 3 of 50 games at temperature 0.8, with 13 draws: about 6%. At the old temperature of 0.5 it won none. These are the July re-baseline runs, with a 43,200-frame cap.

Several improvements that had looked promising stopped looking promising after the fix. A larger model didn't help. A build-queue fix made the executor less likely to get stuck, but didn't win more games. Getting the plumbing right and making a stronger player turned out to be separate jobs.

At temperature 0.5, the policy could also fall into a loop of doing nothing: a static base produced a static observation, then another NoOp. I had chosen that temperature against the broken opponent too.

The July runs are kept in the history with their corrections. The October work moved to the real UAlbertaBot executable in retail StarCraft, with the opponent and observation path checked separately. Later imitation-learning and PPO runs learned to make Gateways and Zealots, but the recorded runs still had no wins. These are different runs from the July re-baseline above.

<!-- block: figure-fig-2-nine-paired-arms-against-the-fixed-opponent -->
FIG. 2 · nine paired arms against the fixed opponent

<!-- block: caption-from-history-md-27-jul-2026-five-arms-shown-same-s -->
From HISTORY.md, 27 Jul 2026 (five arms shown). Same seeds in every arm, so differences are paired. Net wins against the champion at T=0.8: gas +1 (p=1.0), bc_v5 -2 (p=0.625), executor fix 0 (p=1.0).

<!-- block: code-re-baseline-vs-the-fixed-opponent-n-50-per-arm-seeds -->
```
re-baseline vs the fixed opponent, n=50 per arm, seeds 7450-7499
(W-L-D at the standard 43,200-frame cap)

  arm                         T     W-L-D      win rate
  champion_bc_v4              0.8   3-34-13       6%
  champion_bc_v4              1.0   2-30-18       4%
  gas retrain (e2)            0.8   4-36-10       8%
  bc_v5, 18.7M params         0.8   1-32-17       2%
  champion + executor fix     0.8   3-35-12       6%

  champion_bc_v4 at T=0.5: 0-47-3 (0%) in the 26 Jul run
```

<!-- block: the-rough-edges -->
Next steps

<!-- block: open-questions -->
Getting the opening to work

<!-- block: body-getting-the-opening-to-work -->
### Open question

The October notes trace one opening problem to a delay in the replay labels: the agent kept redirecting a Probe before it finished a building. There is still a lot to get right before a win rate is the interesting part.

### Open question II

The later retail runs use a raw command policy rather than the original macro-action vocabulary. That leaves more for the model to learn, including the opening mechanics. I'd like to understand how much of the remaining problem is the data, the policy or the reward.

<!-- block: materialsc-pybind11-pytorch-openbw -->
Materials**C++, pybind11, PyTorch, OpenBW**

<!-- block: vintage2026-stages-0-to-3-done-stage-4-open -->
Status**Work in progress · retail training runs, October 2026**

<!-- block: scale40k-fps-6-770-replays-10 -->
Notes**One map, one matchup, imitation learning first**

<!-- block: sourceprivate -->
Source**private**
