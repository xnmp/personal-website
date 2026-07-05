"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, useNotebookPalette, notebookTextStyle } from "./Chart";
import ladder from "@/data/zsy/ladder.json";

type Step = { label: string; wr: number };
type Generation = { gen: number; wr: number; games: number; opponent: string };

export function ZsyLadder() {
  const p = useNotebookPalette();
  const option = useMemo<echarts.EChartsOption>(() => {
    const steps = ladder.recipe as Step[];
    const labels = steps.map((s) => s.label);
    const values = steps.map((s) => s.wr);
    const lastIndex = steps.length - 1;

    return {
      textStyle: notebookTextStyle(p),
      backgroundColor: "transparent",
      animationDuration: 1200,
      animationEasing: "cubicOut",
      grid: { left: 160, right: 48, top: 24, bottom: 40 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: p.paper,
        borderColor: p.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle(p), fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ dataIndex: number; value: number }>;
          const i = arr[0]?.dataIndex;
          const step = steps[i];
          if (!step) return "";
          return `<strong>${step.label}</strong><br/>win rate: ${(step.wr * 100).toFixed(1)}%`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: 0.5,
        name: "win rate",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { show: false },
        axisLabel: {
          color: p.inkSoft,
          formatter: (v: number) => `${Math.round(v * 100)}%`,
        },
        splitLine: { lineStyle: { color: p.ink, opacity: 0.08 } },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: p.inkSoft } },
        axisTick: { show: false },
        axisLabel: { color: p.inkSoft },
      },
      series: [
        {
          type: "bar",
          data: values,
          barWidth: "60%",
          itemStyle: {
            color: (params: { dataIndex: number }) =>
              params.dataIndex === lastIndex ? p.rust : p.cyan,
            opacity: 0.85,
          },
          emphasis: { itemStyle: { opacity: 1 } },
          animationDelay: (i: number) => i * 80,
          label: {
            show: true,
            position: "right",
            color: p.ink,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            formatter: (params: { value?: unknown }) =>
              `${(Number(params.value) * 100).toFixed(1)}%`,
          },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { type: "dashed", color: p.inkSoft, opacity: 0.6 },
            label: {
              color: p.inkSoft,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              formatter: "seat parity (¼)",
            },
            data: [{ xAxis: 0.25 }],
          },
        },
      ],
    };
  }, [p]);

  return (
    <Chart
      option={option}
      height={320}
      ariaLabel="Win rate improvement across each recipe step"
    />
  );
}

export function ZsyGenerations() {
  const generations = ladder.generations as Generation[];
  return (
    <ul className="zsy-generations">
      {generations.map((g) => (
        <li key={g.gen}>
          gen {g.gen}: {(g.wr * 100).toFixed(1)}% wr over {g.games.toLocaleString()} games vs{" "}
          {g.opponent}
        </li>
      ))}
    </ul>
  );
}
