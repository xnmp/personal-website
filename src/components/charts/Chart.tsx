"use client";
import { useEffect, useRef, useState } from "react";
import type * as echarts from "echarts";

type Props = {
  option: echarts.EChartsOption;
  height?: number;
  ariaLabel?: string;
  /** For a chart with a timeline: play it only while the chart is on screen,
   * and never under reduced motion (the option itself must not autoPlay). */
  playWhileVisible?: boolean;
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Chart({ option, height = 360, ariaLabel, playWhileVisible = false }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);
  const visible = useRef(false);
  const latestOption = useRef(option);
  const [status, setStatus] = useState<"waiting" | "loading" | "ready" | "error">("waiting");

  /** start or stop a timeline to match visibility and the motion setting */
  const syncPlay = (chart: echarts.ECharts) => {
    if (!playWhileVisible) return;
    chart.dispatchAction({ type: "timelinePlayChange", playState: visible.current && !reducedMotion() });
  };

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let started = false;
    let release = () => {};
    const load = async () => {
      if (started) return;
      started = true;
      setStatus("loading");
      try {
        const echarts = await import("echarts");
        if (disposed) return;
        const chart = echarts.init(element, null, { renderer: "svg" });
        instance.current = chart;
        const sync = () => {
          if (playWhileVisible) chart.dispatchAction({ type: "timelinePlayChange", playState: visible.current && !reducedMotion() });
        };
        const onResize = () => chart.resize();
        const playback = playWhileVisible ? new IntersectionObserver(([entry]) => {
          visible.current = entry.isIntersecting;
          sync();
        }, { threshold: 0.4 }) : null;
        release = () => {
          playback?.disconnect();
          window.removeEventListener("resize", onResize);
          chart.dispose();
          instance.current = null;
        };
        window.addEventListener("resize", onResize);
        playback?.observe(element);
        chart.setOption(latestOption.current, { notMerge: true });
        sync();
        setStatus("ready");
      } catch {
        if (!disposed) { release(); setStatus("error"); }
      }
    };
    // Keep offscreen chart code and SVG construction out of page navigation.
    const proximity = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { proximity.disconnect(); void load(); }
    }, { rootMargin: "240px" });
    proximity.observe(element);
    return () => { disposed = true; proximity.disconnect(); release(); };
  }, [playWhileVisible]);

  useEffect(() => {
    latestOption.current = option;
    const chart = instance.current;
    if (!chart) return;
    chart.setOption(option, { notMerge: true });
    syncPlay(chart); // a new option (theme change) resets the timeline's play state
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncPlay reads refs only
  }, [option]);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      aria-busy={status !== "ready" && status !== "error"}
      style={{ width: "100%", height, position: "relative" }}
    >
      <div ref={container} style={{ width: "100%", height: "100%" }} />
      {status !== "ready" && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--ink-soft)", font: "12px var(--font-mono)" }}>
        {status === "error" ? "Chart unavailable. Reload to retry." : "Loading chart…"}
      </span>}
    </div>
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
    fontFamily: "var(--font-ui), Georgia, serif",
    fontSize: 13,
    color: palette.ink,
  };
}

/** @deprecated static light-theme palette; prefer useNotebookPalette() */
export const notebookPalette = lightPalette;
