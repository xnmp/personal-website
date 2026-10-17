---
slug: zheng-shang-you
glyph: 遊
title: Zheng Shang You
heading: Teaching a network the family card game.
href: /p/zheng-shang-you
repo: 'https://github.com/xnmp/zheng-shang-you'
tags:
  - pytorch
  - reinforcement learning
  - behaviour cloning
index: RL + imitation for a 4-player climbing card game · playable
stats:
  - wr 0.471
  - 3 generations
  - 0.15ms/game
art: /screens/zheng-shang-you.png
status: producing
shelf: games
tone: rust
metadata:
  title: 'Zheng Shang You: teaching a network the family card game'
  description: >-
    An RL pipeline for a 4-player Chinese climbing card game: zero-signal
    self-play, behaviour cloning, a perfect-information critic, a generational
    league, and a search whose best lever was variance.
order: 10
---
<!-- block: all-projects -->
← all projects

<!-- block: play-it -->
play it →

<!-- block: headline -->
Teaching a network the family card game.

<!-- block: zheng-shang-you-is-a-4-player-climbing-game-shed-your-hand -->
Zheng Shang You is a 4-player climbing game: shed your hand first, beat the last combination or pass, and bombs outrank everything. The rules took a week. Getting a gradient to point anywhere took months, and the training log keeps every wrong turn.

<!-- block: play-the-strategist -->
Play the strategist

<!-- block: pytorch -->
pytorch

<!-- block: ppo-bc -->
ppo + bc

<!-- block: league-self-play -->
league self-play

<!-- block: rust-engine -->
rust engine

<!-- block: the-dead-end -->
The dead end

<!-- block: self-play-with-zero-signal -->
Self-play with zero signal

<!-- block: the-obvious-approach-douzero-style-deep-monte-carlo-self-p -->
The obvious approach, DouZero-style deep Monte Carlo self-play, produced a result worth framing: **every network scored ~33% regardless of quality**. In symmetric multiplayer self-play, when all seats improve together, relative win rate is flat and the gradient carries no information. The training log records it, dates it, and moves on.

<!-- block: what-replaced-it-is-a-recipe-and-each-step-is-measurable-c -->
What replaced it is a recipe, and each step is measurable: clone the behaviour of a scripted strategist to warm-start; fine-tune with PPO regularized back toward the clone; give the *critic* perfect information (it sees all hands during training; the policy never does) for a lower-variance baseline; shape rewards with a dynamic-programming oracle for minimum-steps-to-shed, 2.6ms per game, 90% cache hit rate.

<!-- block: the-recipe -->
The recipe

<!-- block: the-recipe-one-fix-at-a-time -->
The recipe, one fix at a time

<!-- block: win-rate-in-a-4-player-ring-against-three-scripted-strateg -->
Win rate in a 4-player ring against three scripted strategists. Seat parity is 0.25, so anything above it is real skill.

<!-- block: figure-fig-1-from-cloning-to-search -->
FIG. 1 · From cloning to search

<!-- block: caption-fig-1-every-step-is-one-dated-fix-from-the-trainin -->
Fig. 1: every step is one dated fix from the training log. The last one, determinized search on top of the policy, is worth ten points on its own.

<!-- block: the-search-deserves-its-own-footnote -->
The search deserves its own footnote. Rolling out D=6 determinized worlds and scoring *win/loss* gave zero lift. More search depth didn’t fix it. Scoring rollouts by *final rank* (1.0 / 0.45 / 0.225 / 0) and D=32 is worth +10 points. The problem all along was the estimator’s variance, which is a card-game lesson: second place and fourth place look identical to a win/loss signal.

<!-- block: generations -->
Generations

<!-- block: generations-honestly -->
Generations, honestly

<!-- block: training-win-rate-by-iteration-across-the-league-runs-incl -->
Training win rate by iteration across the league runs, including the ones that went nowhere.

<!-- block: figure-fig-2-league-self-play-runs -->
FIG. 2 · League self-play runs

<!-- block: caption-fig-2-gen-1-reached-0-471-1-000-games-ci-0-44-0-50 -->
Fig. 2: gen-1 reached 0.471 (1,000 games, CI [0.44, 0.50]); gen-2 beats three gen-1s at 0.409 over 450 games; gen-3 is currently flat, and the log says so.

<!-- block: each-generation-trains-against-a-mixture-of-the-frozen-pre -->
Each generation trains against a mixture of the frozen previous champion, past snapshots, and itself. Pure fixed-opponent training plateaus and pure self-play collapses; the league keeps the gradient pointed at the actual target. Gen-3 is the live negative result: five checkpoints of flat proxy matchups against a same-class anchor, and an open diagnosis: the 512×4 policy class may simply be saturated.

<!-- block: supporting-cast-a-pyo3-rust-engine-that-simulates-a-game-i -->
Supporting cast: a PyO3 Rust engine that simulates a game in 0.15ms (14× Python, but only once whole workloads were batched across the boundary), and a behaviour-cloning pipeline that OOM-killed the desktop (wildcard hands can have thousands of legal moves) until cross-entropy against 24 sampled distractors bounded the memory at equal quality.

<!-- block: the-rough-edges -->
The rough edges

<!-- block: open-questions -->
Open questions

<!-- block: gen-3-s-proxy-matchups-are-flat-against-a-same-class-ancho -->
Gen-3’s proxy matchups are flat against a same-class anchor. Saturated policy class, or a league that no longer generates informative opponents? The next experiment measures pure search-depth asymmetry (D=64 vs D=48) to separate the two.

<!-- block: winning-games-average-1 -->
Winning games average 1.5 bombs; second-place games average 1.0. Early bombing is a feature, and the real loss mode is passive endgame racing. Can a reward term see that without hand-coding it?

<!-- block: label-open-question-ii -->
Open question II

<!-- block: materialspytorch-rust-pyo3-python -->
Materials**PyTorch, Rust/PyO3, Python**

<!-- block: vintage2026-in-training -->
Vintage**2026, in training**

<!-- block: scale-14k-loc-3-generations-0 -->
Scale**~14k LoC · 3 generations · 0.15ms/game**

<!-- block: source-github-xnmp-zheng-shang-you-https-github -->
Source **[github/xnmp/zheng-shang-you ](https://github.com/xnmp/zheng-shang-you)**
