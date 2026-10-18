---
slug: ashen-cathedral
glyph: 燼
title: Ashen Cathedral
summary: "I asked GPT-6 Astra to make a first-person version of Diablo 1."
heading: "First-person Diablo, more or less"
href: /p/ashen-cathedral
tags:
  - unreal 5
  - c++
  - "blender"
  - "diablo"
index: "A first-person Diablo experiment · Unreal Engine 5 · paused"
stats:
  - "First-person"
  - "Unreal Engine 5"
  - "Paused"
art: /screens/diablo-clone.png
status: paused
shelf: games
tone: rust
metadata:
  title: "Ashen Cathedral · chong"
  description: "An experiment in asking GPT-6 Astra to make a first-person Diablo-like game in Unreal, and seeing how far it got."
order: 7
---

<!-- block: all-projects -->
← all projects

<!-- block: headline -->
First-person Diablo, more or less

<!-- block: introduction -->
When GPT-6 Astra came out, I tried asking it to make a first-person version of Diablo 1 in Unreal Engine 5. Basically that was the brief. I wanted to see how far it could get from an idea like that.

The result was… passable for a 2010 game, I suppose, but still not there yet. There's a village, a cathedral to descend through and a Butcher to fight. It's paused at the moment.

<!-- block: unreal-5 -->
unreal 5.8

<!-- block: c -->
c++

<!-- block: blender-python -->
blender python

<!-- block: paused -->
paused

<!-- block: the-core -->
Building it

<!-- block: game-rules-that-compile-without-unreal -->
Working without the editor open

<!-- block: seven-headers-in-source-ashencathedral-domain-871-lines-co -->
The rules live in ordinary C++ headers, separate from the Unreal actors.

<!-- block: body-working-without-the-editor-open -->
Combat, items, trading and exploration can be checked without launching Unreal. The actors call those rules when something happens in the game. That makes a small rules change much cheaper to try.

The test script compiles those pieces directly with Clang and sanitizers. It also checks the asset scripts. Most of that work doesn't need the editor or GPU.

There are some checks for absurd coordinates in the fog-of-war code too. The plain C++ version makes those cases easy to exercise.

<!-- block: figure-fig-1-one-of-eight-sanitizer-runs -->
FIG. 1 · one of eight sanitizer runs

<!-- block: caption-from-scripts-test-rules-sh-the-other-seven-follow -->
From Scripts/test_rules.sh. The other seven follow the same pattern for items, trade, enemies, exploration, town map, abilities and UI geometry.

<!-- block: code-clang-std-c-17-wall-wextra-werror-fsanitize-address-u -->
```
clang++ -std=c++17 -Wall -Wextra -Werror \
  -fsanitize=address,undefined \
  Tests/RulesTests.cpp -o Saved/Tests/rules
ASAN_OPTIONS=detect_leaks=0 Saved/Tests/rules
```

<!-- block: the-game -->
The game

<!-- block: what-is-playable -->
What you can walk around in

<!-- block: body-what-you-can-walk-around-in -->
### Built at runtime

The game constructs the dungeon and encounters when the level loads. The map asset itself mostly gives it a starting point.

### Fog of war

In the dungeon the minimap reveals cells by integer line of sight (`mapLineOfSight` in `Exploration.h`). Rays reveal a closed door but cannot see through it, or diagonally between two wall corners. Rooms you have left stay dimly drawn.

### Grid inventory

A 10 by 4 pack. Each item kind has its own footprint, and drag, swap and equip all check the footprint against the grid.

### The Butcher

The Butcher attacks faster once he drops below half health. His wind-up is the chance to guard or get out of the way.

### Greyhollow

A small village with a healer, a blacksmith who buys and sells, and the church you descend through. A labelled town map tracks your facing.

### A short run

It's a short slice of a game, with no mid-run save.

<!-- block: the-pipeline -->
The art

<!-- block: assets-generated-from-code -->
Making things with Blender scripts

<!-- block: scripts-has-12-generate -->
A lot of the assets come from Blender Python scripts, followed by import steps in Unreal.

<!-- block: body-making-things-with-blender-scripts -->
The scripts make props, parts of the town and character candidates. If something looks wrong, the iteration is changing the script and rendering it again. The results vary quite a bit.

The first Butcher was built from primitives, and you can tell. The replacement starts with CC0 MakeHuman anatomy and goes through another set of scripts to add detail and bake the materials. Both versions are below.

<!-- block: figure-fig-2-the-butcher-idle-wind-up-walk-death -->
FIG. 2 · the Butcher, idle, wind-up, walk, death

<!-- block: caption-a-review-sheet-from-artsource-candidates-butcherde -->
A review sheet from ArtSource/Candidates/ButcherDetail/Review, rendered in Blender.

<!-- block: alt-four-renders-of-the-butcher-standing-with-a-cleaver-ra -->
Four renders of the Butcher: standing with a cleaver, raising it overhead, walking, and lying dead.

<!-- block: figure-fig-3-the-procedural-butcher-it-replaced -->
FIG. 3 · the procedural Butcher it replaced

<!-- block: caption-sm-butcher-a-static-mesh-from-primitives-docs-art -->
SM_Butcher, a static mesh from primitives. Docs/ART.md keeps it as a legacy source asset.

<!-- block: alt-a-blocky-pink-orange-butcher-figure-with-a-plank-mask -->
A blocky pink-orange Butcher figure with a plank mask and a cleaver.

<!-- block: the-incident -->
The incident

<!-- block: my-gpu-fell-off-the-bus-so-the-agents-got-limits -->
Then the GPU fell off the bus

<!-- block: sources-docs-gpu-incident -->
Sources: `Docs/GPU_INCIDENT.md` and `Docs/RESOURCE_LIMITS.md`.

<!-- block: body-then-the-gpu-fell-off-the-bus -->
During a packaged run on 7 September 2026, the kernel logged “GPU has fallen off the bus.” Unreal lost the device, the driver stopped answering queries, and the machine needed a restart.

I still don't know what caused it. There wasn't a temperature history to check, and the logs didn't establish overheating or identify a particular Unreal feature as the culprit.

After that I put heavy jobs behind a resource guard: one at a time, with CPU limits and temperature and memory readings. Blender uses CPU rendering for these previews, and native captures are short and guarded.

The guard has since stopped a job when the CPU reached 88.5 °C. That's useful, but it doesn't explain the original GPU fault.

<!-- block: where-it-stands -->
For now

<!-- block: paused-with-a-known-gap -->
An experiment to come back to

<!-- block: body-an-experiment-to-come-back-to -->
The latest town, enemy and lighting revision still needs native validation. The launcher uses an older standalone package until that happens. Between that and the GPU trouble, this is parked for now.

### Open question

I'd like to get back to the question I started with: how close can an agent get to the game in my head? There's still quite a gap, especially in the art.

<!-- block: materialsunreal-engine-5 -->
Materials**Unreal Engine 5.8.2, C++17, Blender Python**

<!-- block: vintageseptember-2026 -->
Vintage**September 2026**

<!-- block: statuspaused-wip -->
Status**Paused WIP**

<!-- block: sourceprivate -->
Source**private**
