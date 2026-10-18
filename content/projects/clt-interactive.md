---
slug: clt-interactive
glyph: Φ
title: Chaos, Added Up
summary: An interactive guide to the central limit theorem.
heading: Five hands-on ways to build intuition for the bell curve.
href: /p/clt-interactive
essay: /clt/index.html
tags:
  - mathematics
  - probability
  - vanilla JavaScript
index: Central limit theorem · interactive probability essay
stats:
  - 5 experiments
  - no dependencies
art: /screens/clt-interactive.svg
status: complete
shelf: tools
tone: amber
order: 13
metadata:
  title: 'Chaos, Added Up: an interactive tour of the central limit theorem'
  description: An interactive essay exploring probability through dice, distributions, entropy and geometry.
---
<!-- block: all-projects -->
← all projects

<!-- block: open-essay -->
Open the interactive essay ↗

<!-- block: headline -->
Chaos, Added Up

<!-- block: intro -->
An interactive essay about the central limit theorem, written for intuition rather than a maths prerequisite. Change the inputs and watch what happens to the distributions.

<!-- block: experiments-heading -->
Five experiments, one bell curve

<!-- block: experiments -->
- **Counting:** add dice and inspect the exact distribution of their sums.
- **Blending:** draw a distribution, then repeatedly convolve it with itself.
- **The truce:** adjust the jitter and tether in a particle swarm.
- **The budget:** reshape a distribution while holding its variance fixed, and compare its entropy with the bell curve.
- **Geometry:** rotate a sample cloud and watch its shadow distribution.

<!-- block: construction-heading -->
A single HTML file

<!-- block: construction -->
Canvas, CSS and vanilla JavaScript. No dependencies or network requests. The experiments pause when they leave the screen, and the essay supports light, dark and reduced-motion preferences.
