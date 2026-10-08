/** Which LED a module shows. Mirrors what is actually true of the project. */
export type Status = "alpha" | "producing" | "paused" | "complete";

/** Rice token used to light the module's screen art. */
export type Tone = "cyan" | "rust" | "amber" | "olive";

export type Shelf = "tools" | "games";

export interface Project {
  slug: string;
  number: string; // "01", silkscreened on the module
  title: string;
  heading: string; // the one-liner
  href: string; // detail page
  /** public source only; private repos are deliberately left unlinked */
  repo?: string;
  tags: string[];
  /** one-line description used by the command index */
  index: string;
  status: Status;
  shelf: Shelf;
  /** 1-bit screen art (alpha mask in public/screens) */
  art: string;
  tone: Tone;
  /** short real numbers for the module's readout */
  stats: string[];
}

export const projects: Project[] = [
  {
    slug: "tauri-explorer",
    number: "01",
    title: "Tauri Explorer",
    heading: "A file manager with the soul of an IDE.",
    href: "/p/tauri-explorer",
    repo: "https://github.com/xnmp/tauri-explorer",
    tags: ["rust", "tauri v2", "svelte 5", "open source"],
    index: "Keyboard-first file manager · Ctrl+P for your filesystem · alpha open",
    status: "alpha",
    shelf: "tools",
    art: "/screens/tauri-explorer.png",
    tone: "amber",
    stats: ["2,534 commits", "~2.7k unit tests", "v1.11.2"],
  },
  {
    slug: "scrivo",
    number: "02",
    title: "Scrivo",
    heading: "A markdown reader that paints first and an editor that never reformats.",
    href: "/p/scrivo",
    repo: "https://github.com/xnmp/scrivo",
    tags: ["rust", "tauri 2", "codemirror 6", "markdown"],
    index: "Typora-style editor · Rust-rendered reading view · benchmarked against Typora",
    status: "producing",
    shelf: "tools",
    art: "/screens/scrivo.png",
    tone: "cyan",
    stats: ["340ms vs Typora 965ms", "12/12 paired runs", "106 test files"],
  },
  {
    slug: "ballast",
    number: "03",
    title: "Ballast",
    heading: "A mood diary that keeps every entry as a plain markdown file.",
    href: "/p/ballast",
    tags: ["svelte 5", "tauri 2", "kotlin", "local-first"],
    index: "Local-first mood diary · desktop + Android · data you can grep",
    status: "producing",
    shelf: "tools",
    art: "/screens/ballast.png",
    tone: "olive",
    stats: ["133 commits", "599 unit · 102 e2e", "desktop + Android"],
  },
  {
    slug: "quickshell-statusbar",
    number: "04",
    title: "Quickshell bar",
    heading: "A status bar that shows what my coding agents are doing.",
    href: "/p/quickshell-statusbar",
    repo: "https://github.com/xnmp-setup/quickshell-statusbar",
    tags: ["qml", "hyprland", "python", "ricing"],
    index: "Hyprland status bar · live Claude/Codex agent state · quota pacing",
    status: "producing",
    shelf: "tools",
    art: "/screens/quickshell-statusbar.png",
    tone: "cyan",
    stats: ["53 commits", "275 tests (py + qml)", "1 Hz JSON stream"],
  },
  {
    slug: "tableau-frog",
    number: "05",
    title: "Tableau Frog",
    heading: "Point at a difference; it tells you if it’s real.",
    href: "/p/tableau-frog",
    repo: "https://github.com/xnmp/tableau-frog",
    tags: ["svelte 5", "statistics", "echarts", "ai-native"],
    index: "Variables-first data explorer · contrast lens with FDR correction",
    status: "producing",
    shelf: "tools",
    art: "/screens/tableau-frog.png",
    tone: "olive",
    stats: ["1M rows <100ms", "z-test + FDR", "59 suites"],
  },
  {
    slug: "lambdaquery",
    number: "06",
    title: "LambdaQuery",
    heading: "Python comprehensions, compiled to SQL.",
    href: "/p/lambdaquery",
    repo: "https://github.com/xnmp/LambdaQuery_2",
    tags: ["python", "compiler", "sql", "semantics"],
    index: "A query compiler · dependent joins, correlated aggregates",
    status: "producing",
    shelf: "tools",
    art: "/screens/lambdaquery.png",
    tone: "amber",
    stats: ["150 tests", "2 bugs caught", "4.7k loc"],
  },
  {
    slug: "ashen-cathedral",
    number: "07",
    title: "Ashen Cathedral",
    heading: "A gothic dungeon crawler where nearly every asset comes out of a script.",
    href: "/p/ashen-cathedral",
    tags: ["unreal 5", "c++", "blender python", "diablo-like"],
    index: "First-person Diablo-like in UE5 · sanitizer-tested rules core · scripted assets",
    status: "paused",
    shelf: "games",
    art: "/screens/diablo-clone.png",
    tone: "rust",
    stats: ["UE 5.8", "~6.9k lines C++", "14 test files"],
  },
  {
    slug: "bwai",
    number: "08",
    title: "Brood War",
    heading: "The game that taught me to think, now a machine-learning problem.",
    href: "/p/bwai",
    tags: ["starcraft", "openbw", "behaviour cloning", "c++/pybind11"],
    index: "A Brood War agent · replay-to-policy pipeline · 40k fps engine bridge",
    status: "producing",
    shelf: "games",
    art: "/screens/bwai.png",
    tone: "cyan",
    stats: ["40,000 fps", "10.3M-param policy", "312 tests"],
  },
  {
    slug: "automatedspike",
    number: "09",
    title: "AutomatedSpike",
    heading: "Looking for Magic decks nobody has built yet, and agents that can pilot them.",
    href: "/p/automatedspike",
    tags: ["python", "reinforcement learning", "xmage", "mtg"],
    index: "MTG Modern deck search + RL pilots · confidence-gated results",
    status: "producing",
    shelf: "games",
    art: "/screens/automatedspike.png",
    tone: "amber",
    stats: ["800-game check", "95% vs naive", "72 test files"],
  },
  {
    slug: "zheng-shang-you",
    number: "10",
    title: "Zheng Shang You",
    heading: "Teaching a network the family card game.",
    href: "/p/zheng-shang-you",
    repo: "https://github.com/xnmp/zheng-shang-you",
    tags: ["pytorch", "reinforcement learning", "behaviour cloning"],
    index: "RL + imitation for a 4-player climbing card game · playable",
    status: "producing",
    shelf: "games",
    art: "/screens/zheng-shang-you.png",
    tone: "rust",
    stats: ["wr 0.471", "3 generations", "0.15ms/game"],
  },
  {
    slug: "eskiv",
    number: "11",
    title: "Eskiv",
    heading: "A brute-force AI that plays a dodger.",
    href: "/p/eskiv",
    repo: "https://github.com/xnmp/Eskiv_new",
    tags: ["python", "pygame", "brute-force", "10,000 games"],
    index: "2016 game, 2026 analysis · how it walks, stands, and dies",
    status: "complete",
    shelf: "games",
    art: "/screens/eskiv.png",
    tone: "olive",
    stats: ["10,000 games", "n_hit = 0", "16.4M steps"],
  },
];

export const bySlug = new Map(projects.map((p) => [p.slug, p]));

/** The flagship: the home page opens on it, its name the first screen's headline. */
export const FLAGSHIP = "tauri-explorer";

/** The row of projects on the home page's first screen, after the flagship:
 *  a tool and three games, as the art directions' mocks show them. */
export const FEATURED = ["scrivo", "ashen-cathedral", "zheng-shang-you", "bwai"];

export const shelves: { id: Shelf; label: string; note: string }[] = [
  { id: "tools", label: "Tools", note: "things I use every day" },
  { id: "games", label: "Games & agents", note: "things that play" },
];

/** The LED each status lights. Pure, so the mapping is testable. */
export function ledFor(status: Status): { color: "green" | "amber" | "signal"; on: boolean; blink: boolean } {
  switch (status) {
    case "alpha":
      return { color: "signal", on: true, blink: true };
    case "producing":
      return { color: "green", on: true, blink: false };
    case "paused":
      return { color: "amber", on: true, blink: false };
    case "complete":
      return { color: "green", on: false, blink: false };
  }
}

export const statusLabel: Record<Status, string> = {
  alpha: "alpha open",
  producing: "active",
  paused: "paused",
  complete: "complete",
};
