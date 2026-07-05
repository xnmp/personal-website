"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, useNotebookPalette, notebookTextStyle } from "./Chart";
import wr from "@/data/zsy/wr.json";

type Row = { i: number; wr: number };
type Run = { name: string; rows: Row[] };

export function ZsyRuns() {
  const p = useNotebookPalette();
  const option = useMemo<echarts.EChartsOption>(() => {
    const runs = wr.runs as Run[];
    const colors = [p.cyan, p.amber, p.olive, p.blue, p.magenta, p.rust];
    const xs = Array.from(
      new Set(runs.flatMap((r) => r.rows.map((row) => row.i)))
    ).sort((a, b) => a - b);

    return {
      textStyle: notebookTextStyle(p),
      backgroundColor: "transparent",
      animationDuration: 1000,
      animationEasing: "cubicOut",
      grid: { left: 56, right: 32, top: 56, bottom: 44 },
      legend: {
        data: runs.map((r) => r.name),
        top: 8,
        textStyle: { ...notebookTextStyle(p), fontSize: 10, fontFamily: "var(--font-mono), monospace" },
        itemGap: 16,
        itemWidth: 14,
        itemHeight: 8,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: p.paper,
        borderColor: p.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle(p), fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as Array<{
            seriesName: string;
            axisValue: number;
            value: number | null;
            marker: string;
          }>;
          const lines = arr
            .filter((p) => p.value !== null && p.value !== undefined)
            .map((p) => `${p.marker}${p.seriesName}: ${((p.value as number) * 100).toFixed(1)}%`);
          return [`<strong>iteration ${arr[0]?.axisValue}</strong>`, ...lines].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: xs,
        name: "iteration",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { lineStyle: { color: p.inkSoft } },
        axisTick: { lineStyle: { color: p.inkSoft } },
        axisLabel: { color: p.inkSoft },
      },
      yAxis: {
        type: "value",
        name: "win rate",
        nameLocation: "middle",
        nameGap: 44,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { show: false },
        axisLabel: {
          color: p.inkSoft,
          formatter: (v: number) => `${Math.round(v * 100)}%`,
        },
        splitLine: { lineStyle: { color: p.ink, opacity: 0.08 } },
      },
      series: runs.map((run, idx) => {
        const byI = new Map(run.rows.map((row) => [row.i, row.wr]));
        return {
          name: run.name,
          type: "line" as const,
          data: xs.map((x) => (byI.has(x) ? byI.get(x) : null)),
          connectNulls: true,
          symbol: "circle",
          symbolSize: 0,
          showSymbol: false,
          emphasis: { focus: "series", symbolSize: 6 },
          lineStyle: { color: colors[idx % colors.length], width: 1.5 },
          itemStyle: { color: colors[idx % colors.length] },
          markLine:
            idx === 0
              ? {
                  silent: true,
                  symbol: "none",
                  lineStyle: { type: "dashed", color: p.inkSoft, opacity: 0.6 },
                  label: {
                    color: p.inkSoft,
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    formatter: "seat parity",
                  },
                  data: [{ yAxis: 0.25 }],
                }
              : undefined,
        };
      }),
    };
  }, [p]);

  return <Chart option={option} height={340} ariaLabel="Win rate across training runs by iteration" />;
}
