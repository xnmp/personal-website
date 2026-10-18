---
metadata:
  title: About · chong
kicker: About · Sydney
headline: "Hi! I’m Chong, and this is my garden"
intro: intro
sections:
  - kicker: "Streamlining Workflows"
    heading: "Streamlining Workflows"
    aside: "Making personal apps and tools to make it all as minimal and intuitive as possible"
    body: section-1
  - kicker: Setup
    heading: "Exploring AI Capabilities more Broadly"
    aside: "Fun experiments to see what the models are capable of, and frameworks to leverage AI at scale"
    body: section-2
  - kicker: Background
    heading: "Game AI and Reinforcement Learning"
    aside: "Always dreamt of making my own game AI, but the learning curve (pardon the pun) is a bit steep, and it's only with the advent of AI (as in LLMs) that it's become possible for me"
    body: section-3
    draft: true
  - kicker: Away from the keyboard
    heading: "Making Maths More Accessible"
    aside: "Specifically undergraduate maths. "
    body: section-4
    draft: true
facts:
  - label: Based in
    value: Sydney
  - label: Works in
    value: "Python, Svelte, but who cares anymore - anything goes with AI, especially Rust"
  - label: Runs on
    value: "NixOS, Arch, Hyprland, Ghostty, Obsidian"
  - label: Source
    value: '[github/xnmp](https://github.com/xnmp)'
  - label: Write to
    value: '[chonw@proton.me](mailto:chonw@proton.me)'
---
<!-- block: intro -->
I'm a nerd at heart, I like to solve interesting problems, I'd call myself a cross-discipline generalist, maybe even a maverick, an AI once read my Obsidian Vault and said I have hacker mystic vibes and I took that and ran with it. This is my website! It contains a broad survey of my current and past interests and I hope it gives a clear overall picture of my intellectual life. Below are the four areas that are on my plate right now - click the headers to be brought to the relevant section of the project page.

Besides my technical interests I like to go hiking on the many trails around Sydney, play basketball in a couple of social leagues, play board games, read fiction, and give my balcony a Bohemian look.

<!-- block: section-1 -->
I used to play Starcraft: Brood War fairly competitively, so I guess a bit of the same optimization philosophy has come from there. And in the age of AI I'm finding more and more that with implementation being so cheap, the bottleneck becomes cognitive overhead. I've always though of optimizing your workflow as something like tuning a laser, and when friction becomes lower than the activation energy is when one can enter a flow state. Near the threshold every tiny little bit counts. So yeah I would've been the guy spending hours tuning a IDE plugin just to save a couple of extra clicks now and again (although I didn't use Vim or Emacs). The idea is that your workflow should be intuitive enough that anything you should be able to do, you can do. 

My projects in this vein include
- Tauri Explorer, my main project right now, a file explorer app using Rust + Svelte (the Tauri framework) made exactly the way I want it. 
- My overall setup at home, which involves a fairly elaborate Hyprland setup, a homemade status bar, and a fairly huge dotfile repo (using chezmoi). 
- Having all my intellectual context be in one place to be agent searchable - for example setting up scrapping to sync all my ChatGPT/Claude conversations, Twitter/Substack bookmarks, Obsidian Vaults, all in one place. 

I also have a number of minor interests Please see [here] for more details.

<!-- block: section-2 -->
I find sometimes you know intellectually you know what models and harnesses of today are capable of, but it often take a fortuituous moment to really have it sink in. For months I knew that I could use voice on Codex/Claude code, and I thought it was a bit of a gimmick. Then one day I was getting Codex to debug my microphone, started speaking through it, and realized I could just ask Codex something like "make my wallpaper higher res" and it'd go DO IT - send the relevant request to the OpenAI image API and change the wallpaper on your computer directly, it's only then it really clicked in my hindbrain "oh, I can just tell the computer to DO STUFF". So I like to have a good idea of what's possible with the current generation of frontier models and just TRY things - doing what's in your head is how you expand your idea of what's possible, and very much is possible with AI that hasn't gotten into my head yet. A couple of fun experiments along these lines are:
- Making websites using a custom asset generated workflow similar to what's done for AAA games - this website was made from some of them - try clicking on the "style" button in the sidebar to switch to one of several styles - forgive the AI slop factor. 
- Making versions of my favourite games - eg I tried to make a first person clone of Diablo 1 in Unreal 5 Engine by basically saying exactly this to GPT 6 Astra when it came out - the results were… passable for a 2010 game I suppose but still not there yet. 
- Making a alternative/indie rock version of E for Exctinction by Thousand Foot Crutch - beware, it's an abomination but my curiosity gets the best of me.

<!-- block: section-3 -->
Optimal play in games has always kinda fascinated me, chess engines fascinated me as a kid, I was stunned that innovative moves such as AlphaGo's move 37, or the innovations of AlphaZero, could come from a reinforcement learning process, and the high profile AI gaming results always came in the games that I play - Starcraft 2 and Dota 2. The holy grail for me was always doing this in Starcraft: Brood War too - the game I grew up with and something of a first love gaming-wise. 

I also played Magic: the Gathering and always loved seeing new brews so bursting with synergy, but always wondered what reinforcement learning would do to it - perhaps it'd have many more one-ofs than humans brew with, perhaps it'd come up with highly unexpected card choices that'd look innocuous but only testing would reveal how good they are.

The contribution I can call completely my own here is in a game called Eskiv, a game we played in high school, where I recreated the game  and created a near-perfect play bot for, during Covid entirely before AI.

<!-- block: section-4 -->
My master's thesis in 2015 was on exactly this, but AI makes it possible in a way never before seen. I'm aware of the havoc in the maths community in the wake of the recent mathpocalpyse unleashed by OpenAI and have a lot of sympathy for it. My token support for the maths community is to use AI in an expository capacity on some interesting problems I worked on as an undergrad - a couple of examples here.
