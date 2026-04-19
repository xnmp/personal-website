"use client";
import { useEffect, useRef } from "react";
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

export const notebookPalette = {
  ink: "#073642",
  inkSoft: "#586e75",
  paper: "#fdf6e3",
  rust: "#cb4b16",
  amber: "#b58900",
  cyan: "#2aa198",
  olive: "#859900",
  blue: "#268bd2",
  magenta: "#d33682",
};

export const notebookTextStyle: echarts.EChartsOption["textStyle"] = {
  fontFamily:
    "var(--font-crimson), Georgia, serif",
  fontSize: 13,
  color: notebookPalette.ink,
};
