---
slug: tauri-explorer
glyph: 檔
title: Tauri Explorer
summary: "The file explorer I built because nothing quite fit my needs"
preview:
  src: /tauri/hero-quick-open-{theme}.webp
  alt: Tauri Explorer with Quick Open finding files by name.
  width: 698
  height: 438
heading: "A Fully Featured File Explorer"
href: /p/tauri-explorer
repo: 'https://github.com/xnmp/tauri-explorer'
website: 'https://tauri-explorer.vercel.app'
tags:
  - rust
  - tauri v2
  - svelte 5
  - open source
index: "My file explorer · Rust and Svelte · notes on building it"
stats:
  - "Linux · macOS · Windows"
  - "Rust + Svelte"
  - "In development"
art: /screens/tauri-explorer.png
status: alpha
shelf: tools
tone: amber
version: v1.11.2
email: chonw@proton.me
nix_scheme: 'nix run github:'
nix_repo: xnmp/tauri-explorer
metadata:
  title: "Tauri Explorer · chong"
  description: "Why I built my own file explorer, after using Marta and Fileside and wanting different bits of each."
  openGraph:
    title: "Tauri Explorer · chong"
    description: "Why I built my own file explorer, after using Marta and Fileside and wanting different bits of each."
shots:
  - scene: content-search
    w: 1176
    h: 708
    focus:
      x: 0.25
      'y': 0.06
    label: Content search
    note: "Search results grouped by file, with the matching text beside them."
  - scene: command-palette
    w: 1176
    h: 784
    focus:
      x: 0.25
      'y': 0.06
    label: Command palette
    note: "Changing a theme through the command palette."
  - scene: git-graph
    w: 1696
    h: 374
    focus:
      x: 0.155
      'y': 0.15
    label: Git graph
    note: "The Git graph beside the file list."
order: 1
---

<!-- block: all-projects -->
← all projects

<!-- block: website -->
Tauri Explorer website ↗

<!-- block: github -->
GitHub ↗

<!-- block: headline -->
A Fully Featured File Explorer

<!-- block: subtitle -->
By fully featured I really do mean fully featured

<!-- block: introduction -->
When I was tuning my setup earlier this year and really going hard on the productivity, I realized that there was no file explorer app on any platform that had everything I wanted. So I built it.

Downloads, installation instructions and the feature list are on the [Tauri Explorer website ↗]({{website}}).

<!-- block: screenshot-alt -->
Tauri Explorer’s window with quick open over it after typing “read”: README.md ranked first, then the feature docs, each with the matched letters underlined

<!-- block: origin-kicker -->
Where it started

<!-- block: origin-heading -->
The little things that bothered me

<!-- block: body-the-little-things-that-bothered-me -->
I really wanted to use apps that fit my needs completely. I needed a terminal app, an IDE (even if I started using it less and less), a note editing app, and a browser, and a file explorer - nobody can go without a file explorer. For all the others I found apps that fit my brain - Ghostty/Wezterm as a terminal, Obsidian for a note editor (although it doesn't directly edit - more on that later), and Chrome was already enough for me as a browser. But it seemed like no good solutions existed for a terminal app! 

It seemed like regular Windows Explorer on Windows 11 was the best option - it had tabs, was performant, looked really polished, and for a while I tried using a customization tool called Windhawk to remove the bloat, for example the cut and paste icons because I never used them (only ever using the shortcuts). But I could quite do it. I used [Marta](https://marta.sh/) on Mac OSX for a while because it had dual pane and a Ctrl + P frecency search, as well as a great innovation of having an attached terminal change directory as you navigate in the file explorer, also going vice versa so that you oculd use [zoxide](https://github.com/ajeetdsouza/zoxide) to navigate your file explorer too. But the little things bothered me - for example, after selecting a folder with Ctrl+P, I'd have to hit Enter twice to navigate into it. And I wanted to hide the status bar. 

I also used [Fileside](https://www.fileside.app/) on Windows for a while because it had multiple panes and was minimal, but there wasn't even a thumbnail view. [Bloom](https://bloomapp.club/) is another standout for feeling OSX native while having a Ctrl + P navigation. There were bits I liked in every app, but nothing had everything I wanted.

<!-- block: building-kicker -->
Building it

<!-- block: building-heading -->
What grew out of that

<!-- block: body-what-grew-out-of-that -->
So, given all the great things I was hearing about Opus 4.5 at its time of release, I decided to take the plunge, and what the hell since it's all going to be AI written anyway I might as well use Rust in the Tauri framework. The specs were
- **Fully featured** - in fact just having everything I liked in other apps and then on steroids. Other apps had dual pane? Well we'll just allows as many panes as you want origami/dwindle style, like in Ghostty or Wezterm. Other apps had a preview pane? Well let's have that, as well as a full screen preview, and throw video preview on top. And let's add Git Graph and source control as well, since after a while I realized that half the time I was opening VSCode it was just for Git Graph. 
- **Minimal** - I was inspired when I first used [Hyprland](https://hypr.land/), I logged in and literally the only thing on the desktop is one empty terminal screen with a bare prompt.  So I wanted to be able to completely remove the bloat. In Tauri Explorer, every single bar is toggleable, down to the address bar, leaving just a file pane.
- **Customizable** - having configurable everything, hotkeys, themes, icon themes, all towards allowing the user to make it exactly like they want it. 
- **Performant** - despite being fully featured, it's blazing fast Rust, and every last bit has been extensively optimized, perhaps not quite to the level of Ghostty but by god frontier models have been trying their best and being a former gamer I am quite intolerant of the slightest lag. 
- **Extensible** - a plugin system so that people can add what they want in case I missed anything. Of course this includes AI integration - the first plugin I ever made was for Nanobanana to edit images directly within the file explorer.

<!-- block: materials -->
Materials**Rust, Tauri v2, Svelte 5**

<!-- block: platforms -->
Platforms**Linux · macOS · Windows**

<!-- block: licence -->
Licence**MIT**

<!-- block: source -->
Source **:link[github/xnmp/tauri-explorer]{href="https://github.com/xnmp/tauri-explorer" class="nowrap"}**

<!-- block: project-notes -->
How I built it →
