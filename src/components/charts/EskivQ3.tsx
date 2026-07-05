"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, useNotebookPalette, notebookTextStyle } from "./Chart";
import q3 from "@/data/eskiv/q3.json";

type Bin = { x: number; count: number };

export function EskivQ3() {
  const p = useNotebookPalette();
  const option = useMemo<echarts.EChartsOption>(() => {
    const bins = q3.bins as Bin[];
    const s = q3.summary as {
      mean: number;
      median: number;
      n_games: number;
      n_trapped: number;
      n_hit: number;
      stddev: number;
    };

    return {
      textStyle: notebookTextStyle(p),
      backgroundColor: "transparent",
      animationDuration: 1200,
      animationEasing: "cubicOut",
      grid: { left: 64, right: 32, top: 28, bottom: 56 },
      tooltip: {
        trigger: "axis",
        backgroundColor: p.paper,
        borderColor: p.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle(p), fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: number; value: number }>;
          const p = arr[0];
          return `<strong>score ≈ ${p.axisValue}</strong><br/>${p.value.toLocaleString()} games`;
        },
      },
      xAxis: {
        type: "category",
        data: bins.map((b) => b.x),
        name: "final score",
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { lineStyle: { color: p.inkSoft } },
        axisTick: { alignWithLabel: true, lineStyle: { color: p.inkSoft } },
        axisLabel: {
          color: p.inkSoft,
          interval: Math.ceil(bins.length / 10),
        },
      },
      yAxis: {
        type: "value",
        name: "games",
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { show: false },
        axisLabel: { color: p.inkSoft },
        splitLine: { lineStyle: { color: p.ink, opacity: 0.08 } },
      },
      series: [
        {
          type: "bar",
          data: bins.map((b) => b.count),
          barWidth: "92%",
          itemStyle: {
            color: p.cyan,
            opacity: 0.82,
          },
          emphasis: { itemStyle: { color: p.rust, opacity: 1 } },
          animationDelay: (i: number) => i * 10,
          markLine: {
            symbol: "none",
            silent: true,
            label: {
              color: p.ink,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              position: "insideEndTop",
            },
            lineStyle: { color: p.ink, opacity: 0.7, width: 1.2 },
            data: [
              {
                name: `mean = ${s.mean.toFixed(1)}`,
                xAxis: nearestBin(bins, s.mean),
              },
              {
                name: `median = ${Math.round(s.median)}`,
                xAxis: nearestBin(bins, s.median),
                lineStyle: { type: "dashed" },
              },
            ],
          },
        },
      ],
    };
  }, [p]);

  return <Chart option={option} height={340} ariaLabel="Final score distribution across 10,000 games" />;
}

function nearestBin(bins: { x: number }[], value: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < bins.length; i++) {
    const d = Math.abs(bins[i].x - value);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
