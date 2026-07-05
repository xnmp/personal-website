"use client";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

type Props = {
  option: echarts.EChartsOption;
  height?: number;
  ariaLabel?: string;
};

export function Chart({ option, height = 360, ariaLabel }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const chart = echarts.init(container.current, null, { renderer: "svg" });
    instance.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      instance.current = null;
    };
  }, []);

  useEffect(() => {
    instance.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={container}
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height }}
    />
  );
}

export interface NotebookPalette {
  ink: string;
  inkSoft: string;
  paper: string;
  paperWarm: string;
  rule: string;
  rust: string;
  amber: string;
  cyan: string;
  olive: string;
  blue: string;
  magenta: string;
}

const lightPalette: NotebookPalette = {
  ink: "#073642",
  inkSoft: "#586e75",
  paper: "#fdf6e3",
  paperWarm: "#f6efd8",
  rule: "#d8c98a",
  rust: "#cb4b16",
  amber: "#b58900",
  cyan: "#2aa198",
  olive: "#859900",
  blue: "#268bd2",
  magenta: "#d33682",
};

function readPalette(): NotebookPalette {
  if (typeof window === "undefined") return lightPalette;
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) =>
    s.getPropertyValue(name).trim() || fallback;
  return {
    ink: v("--ink", lightPalette.ink),
    inkSoft: v("--ink-soft", lightPalette.inkSoft),
    paper: v("--paper", lightPalette.paper),
    paperWarm: v("--paper-warm", lightPalette.paperWarm),
    rule: v("--rule", lightPalette.rule),
    rust: v("--rust", lightPalette.rust),
    amber: v("--amber", lightPalette.amber),
    cyan: v("--cyan", lightPalette.cyan),
    olive: v("--olive", lightPalette.olive),
    blue: "#268bd2",
    magenta: "#d33682",
  };
}

/**
 * Palette that tracks the live theme: charts re-render when the lamp (`t`)
 * toggles. Reads the CSS custom properties so chart colors and page colors
 * can never drift apart.
 */
export function useNotebookPalette(): NotebookPalette {
  const [palette, setPalette] = useState<NotebookPalette>(lightPalette);
  useEffect(() => {
    const update = () => setPalette(readPalette());
    update();
    window.addEventListener("nb-themechange", update);
    return () => window.removeEventListener("nb-themechange", update);
  }, []);
  return palette;
}

export function notebookTextStyle(
  palette: NotebookPalette
): echarts.EChartsOption["textStyle"] {
  return {
    fontFamily: "var(--font-crimson), Georgia, serif",
    fontSize: 13,
    color: palette.ink,
  };
}

/** @deprecated static light-theme palette; prefer useNotebookPalette() */
export const notebookPalette = lightPalette;
