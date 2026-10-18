/** Additional palettes, pinned to their upstream colour definitions.
 * Ayu: https://github.com/ayu-theme/ayu-colors/blob/master/themes/mirage.yaml
 * Latte: https://github.com/catppuccin/palette/blob/main/palette.json (v1.8.0)
 * Gruvbox: https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim
 * Solarized: https://ethanschoonover.com/solarized/
 * Text roles are adjusted where necessary for 4.5:1 surface contrast.
 */
const palette = ({ bg, panel, ink, muted, rule, red, yellow, cyan, green, accent, light = false }) => ({
  "--paper": bg, "--paper-warm": panel, "--ink": ink, "--ink-soft": muted, "--rule": rule,
  "--rust": red, "--amber": yellow, "--cyan": cyan, "--olive": green, "--rice-accent": accent,
  "--code-bg": light ? "rgba(76, 79, 105, 0.05)" : "color-mix(in srgb, var(--ink) 7%, transparent)",
  "--code-border": "color-mix(in srgb, var(--ink) 14%, transparent)",
  "--shadow": light ? "rgba(76, 79, 105, 0.2)" : "rgba(0, 0, 0, 0.55)",
  "--overlay": "color-mix(in srgb, var(--paper) 65%, transparent)",
});

export const EXTRA_PALETTES = {
  "ayu-mirage": palette({ bg: "#1f2430", panel: "#242936", ink: "#cccac2", muted: "#9aa4b3", rule: "#3a4253",
    red: "#f28779", yellow: "#ffcc66", cyan: "#95e6cb", green: "#d5ff80", accent: "#ffcc66" }),
  "catppuccin-latte": palette({ bg: "#eff1f5", panel: "#e6e9ef", ink: "#4c4f69", muted: "#5c5f77", rule: "#ccd0da",
    red: "#cf0c36", yellow: "#8f5b0d", cyan: "#0f7278", green: "#2d751f", accent: "#8737ed", light: true }),
  gruvbox: palette({ bg: "#282828", panel: "#32302f", ink: "#ebdbb2", muted: "#a89984", rule: "#504945",
    red: "#ff6b59", yellow: "#fabd2f", cyan: "#8ec07c", green: "#b8bb26", accent: "#fe8019" }),
  "solarized-light": {
    ...palette({ bg: "#fdf6e3", panel: "#eee8d5", ink: "#073642", muted: "#576c73", rule: "#93a1a1",
      red: "#c52d2a", yellow: "#846400", cyan: "#1e746d", green: "#606f00", accent: "#1e6da5", light: true }),
    "--code-bg": "rgba(7, 54, 66, 0.05)",
    "--shadow": "rgba(0, 43, 54, 0.18)",
  },
};
