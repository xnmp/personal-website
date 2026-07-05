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

// SSR/pre-mount fallback: the "paper" rice from rice.css.
const lightPalette: NotebookPalette = {
  ink: "#16161c",
  inkSoft: "#5c5f70",
  paper: "#fcfbf9",
  paperWarm: "#f4f2ee",
  rule: "#e0ddd6",
  rust: "#cd4b69",
  amber: "#9b715c",
  cyan: "#1e92a9",
  olive: "#1c9068",
  blue: "#26BBD9",
  magenta: "#EE64AE",
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
