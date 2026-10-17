/** Colour palettes, independently of the site's art direction. */
export const RICES = ["paper", "horizon", "cosmic-dusk", "rapture", "ayu-mirage", "catppuccin-latte", "gruvbox"] as const;
export type Rice = (typeof RICES)[number];
export type RiceMode = "light" | "dark";

export const RICE_MODES = {
  paper: "light", horizon: "dark", "cosmic-dusk": "dark", rapture: "dark",
  "ayu-mirage": "dark", "catppuccin-latte": "light", gruvbox: "dark",
} as const satisfies Record<Rice, RiceMode>;

export const riceLabel = (rice: string) => rice.replace(/-/g, " ");
export const riceMode = (rice: Rice): RiceMode => RICE_MODES[rice];
