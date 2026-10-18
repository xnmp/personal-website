---
slug: zheng-shang-you
glyph: 遊
title: Zheng Shang You
summary: "Teaching a network the card game we play at home."
heading: "The card game we play at home"
href: /p/zheng-shang-you
repo: 'https://github.com/xnmp/zheng-shang-you'
tags:
  - pytorch
  - reinforcement learning
  - behaviour cloning
index: "Our family card game · learning agents · playable version"
stats:
  - "Four players"
  - "Self-play"
  - "Playable"
art: /screens/zheng-shang-you.png
status: producing
shelf: games
tone: rust
metadata:
  title: "Zheng Shang You · chong"
  description: "Trying imitation learning, self-play and search on my family's card game, Zheng Shang You."
order: 10
---
<!-- block: all-projects -->
← all projects

<!-- block: play-it -->
play it →

<!-- block: headline -->
The card game we play at home

<!-- block: zheng-shang-you-is-a-4-player-climbing-game-shed-your-hand -->
Zheng Shang You is a card game we play in my family. Four players try to get rid of their hands, beating the last combination or passing, with bombs that outrank the ordinary combinations.

I wanted to see what a learning agent would make of it. There's a playable version here too, if you'd like to get a feel for the game.

<!-- block: play-the-strategist -->
Play a game

<!-- block: pytorch -->
pytorch

<!-- block: ppo-bc -->
ppo + bc

<!-- block: league-self-play -->
league self-play

<!-- block: rust-engine -->
rust engine

<!-- block: the-dead-end -->
Early attempts

<!-- block: self-play-with-zero-signal -->
Self-play wasn't getting me very far

<!-- block: the-obvious-approach-douzero-style-deep-monte-carlo-self-p -->
An early Monte Carlo self-play setup kept returning scores around 33%, without giving me a useful way to tell whether the networks were improving. The training log records that dead end. I moved to cloning a scripted player, then using it as a starting point for further training.

<!-- block: what-replaced-it-is-a-recipe-and-each-step-is-measurable-c -->
The later setup combines imitation learning and PPO. The critic can see all the hands during training, while the policy only gets the player's information. There's also a small oracle that estimates how many moves a hand needs to shed.

<!-- block: the-recipe -->
Changing the setup

<!-- block: the-recipe-one-fix-at-a-time -->
What helped in the recorded runs

<!-- block: win-rate-in-a-4-player-ring-against-three-scripted-strateg -->
These are four-player evaluations against three copies of the scripted strategist. A quarter of wins is the equal-seat reference point.

<!-- block: figure-fig-1-from-cloning-to-search -->
FIG. 1 · From cloning to search

<!-- block: caption-fig-1-every-step-is-one-dated-fix-from-the-trainin -->
Recorded changes from the training log. These comparisons use their stated opponents and setups; they're not a rating against human players.

<!-- block: the-search-deserves-its-own-footnote -->
One result I found interesting was changing how the search scored a rollout. Looking only at a win or loss made second and fourth place equally bad. Giving them different scores, along with more sampled hands, helped substantially in the logged comparison. It wasn't just a matter of searching deeper.

<!-- block: generations -->
Generations

<!-- block: generations-honestly -->
Training against earlier versions

<!-- block: training-win-rate-by-iteration-across-the-league-runs-incl -->
The league runs below include the attempts that levelled off.

<!-- block: figure-fig-2-league-self-play-runs -->
FIG. 2 · League self-play runs

<!-- block: caption-fig-2-gen-1-reached-0-471-1-000-games-ci-0-44-0-50 -->
Fig. 2: gen-1 reached 0.471 (1,000 games, CI [0.44, 0.50]); gen-2 beats three gen-1s at 0.409 over 450 games; gen-3 is currently flat, and the log says so.

<!-- block: each-generation-trains-against-a-mixture-of-the-frozen-pre -->
Each generation plays a mixture of the previous champion, older snapshots and itself. Fixed opponents and pure self-play each ran into problems. The third generation's logged proxy results were flat, and I hadn't settled whether that was the model or the opponents.

<!-- block: supporting-cast-a-pyo3-rust-engine-that-simulates-a-game-i -->
There were some less glamorous problems too. Crossing between Python and Rust only paid off once whole workloads were batched. And wildcard hands can have so many legal moves that the cloning pipeline ran out of memory. Sampling alternative moves bounded that cost.

<!-- block: the-rough-edges -->
Things to try

<!-- block: open-questions -->
Where the next improvement might come from

<!-- block: gen-3-s-proxy-matchups-are-flat-against-a-same-class-ancho -->
I'd like to separate the value of a larger policy from the value of more search. The flat third-generation runs didn't answer that.

<!-- block: winning-games-average-1 -->
The logs also suggest passive endgames are a problem. It would be interesting to see whether training can learn when to spend a bomb without me encoding that advice into the reward.

<!-- block: label-open-question-ii -->
Open question II

<!-- block: materialspytorch-rust-pyo3-python -->
Materials**PyTorch, Rust/PyO3, Python**

<!-- block: vintage2026-in-training -->
Vintage**2026, in training**

<!-- block: scale-14k-loc-3-generations-0 -->
Notes**Imitation learning, self-play and search**

<!-- block: source-github-xnmp-zheng-shang-you-https-github -->
Source **[github/xnmp/zheng-shang-you ](https://github.com/xnmp/zheng-shang-you)**
