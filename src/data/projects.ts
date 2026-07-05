export interface Project {
  slug: string;
  number: string; // "№ 01"
  roman: string; // "Entry I"
  title: string;
  heading: string; // the italic-serif one-liner
  href: string; // detail page
  repo?: string;
  tags: string[];
  /** one-line description used by the command index */
  index: string;
  status: "producing" | "complete" | "forthcoming";
}

export const projects: Project[] = [
  {
    slug: "tauri-explorer",
    number: "№ 01",
    roman: "Entry I",
    title: "Tauri Explorer",
    heading: "A file manager with the soul of an IDE.",
    href: "/p/tauri-explorer",
    repo: "https://github.com/xnmp/tauri-explorer",
    tags: ["rust", "tauri v2", "svelte 5", "open source"],
    index: "Keyboard-first file manager · 1,632 commits · unit/e2e/perf CI",
    status: "producing",
  },
  {
    slug: "lambdaquery",
    number: "№ 02",
    roman: "Entry II",
    title: "LambdaQuery",
    heading: "Python comprehensions, compiled to SQL.",
    href: "/p/lambdaquery",
    repo: "https://github.com/xnmp/LambdaQuery_2",
    tags: ["python", "compiler", "sql", "semantics"],
    index: "A query compiler — dependent joins, correlated aggregates",
    status: "producing",
  },
  {
    slug: "zheng-shang-you",
    number: "№ 03",
    roman: "Entry III",
    title: "Zheng Shang You",
    heading: "Teaching a network the family card game.",
    href: "/p/zheng-shang-you",
    repo: "https://github.com/xnmp/zheng-shang-you",
    tags: ["pytorch", "reinforcement learning", "behaviour cloning"],
    index: "RL + imitation for a 4-player climbing card game",
    status: "producing",
  },
  {
    slug: "tableau-frog",
    number: "№ 04",
    roman: "Entry IV",
    title: "Tableau Frog",
    heading: "Point at a difference; it tells you if it's real.",
    href: "/p/tableau-frog",
    repo: "https://github.com/xnmp/tableau-frog",
    tags: ["svelte 5", "statistics", "echarts", "ai-native"],
    index: "Variables-first data explorer · contrast lens with FDR correction",
    status: "producing",
  },
  {
    slug: "eskiv",
    number: "№ 05",
    roman: "Entry V",
    title: "Eskiv",
    heading: "A brute-force AI that plays a dodger.",
    href: "/p/eskiv",
    repo: "https://github.com/xnmp/Eskiv_new",
    tags: ["python", "pygame", "brute-force", "10,000 games"],
    index: "2016 game, 2026 analysis — how it walks, stands, and dies",
    status: "complete",
  },
  {
    slug: "bwai",
    number: "№ 06",
    roman: "Entry VI",
    title: "Brood War",
    heading: "The game that taught me to think, revisited as a problem.",
    href: "/p/bwai",
    repo: "https://github.com/xnmp/bwai",
    tags: ["starcraft", "openbw", "behaviour cloning", "c++/pybind11"],
    index: "An agent for the game I once played competitively · 40k fps bridge",
    status: "producing",
  },
];

export const bySlug = new Map(projects.map((p) => [p.slug, p]));
