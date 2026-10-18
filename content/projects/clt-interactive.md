---
slug: clt-interactive
glyph: Φ
title: Chaos, Added Up
summary: "An interactive essay about why sums of random things tend towards a bell curve."
heading: "Chaos, Added Up"
href: /p/clt-interactive
essay: /clt/index.html
tags:
  - mathematics
  - probability
  - vanilla JavaScript
index: "Central limit theorem · interactive mathematical exposition"
stats:
  - "5 experiments"
  - "Interactive essay"
art: /screens/clt-interactive.svg
status: complete
shelf: tools
tone: amber
order: 13
metadata:
  title: "Chaos, Added Up · chong"
  description: "An experiment in explaining the central limit theorem through things you can change and watch, rather than starting with the formula."
---
<!-- block: all-projects -->
← all projects

<!-- block: open-essay -->
Open the interactive essay ↗

<!-- block: headline -->
Chaos, Added Up

<!-- block: intro -->
I'm interested in using AI to make maths more accessible. This is one experiment in that direction: explaining the central limit theorem through things you can change and watch.

Adding up independent random quantities often gives a distribution close to a bell curve. The essay approaches that from a few different angles, starting with dice and working through to geometry.

<!-- block: experiments-heading -->
A few ways into the same idea

<!-- block: experiments -->
- **Counting:** add dice and look at how many ways there are to get each sum.
- **Blending:** draw a distribution and repeatedly combine it with itself.
- **The truce:** change the jitter and tether in a particle swarm.
- **The budget:** reshape a distribution while keeping its variance fixed.
- **Geometry:** rotate a cloud of samples and watch the distribution of its shadow.

<!-- block: construction-heading -->
How it's put together

<!-- block: construction -->
It's a single HTML file with canvas experiments, CSS and JavaScript. The experiments are different ways to build intuition around the bell curve; they aren't all proofs of the central limit theorem. There are no dependencies to install, and the copy here opens as a standalone page.
