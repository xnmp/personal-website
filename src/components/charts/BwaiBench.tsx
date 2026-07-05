"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, useNotebookPalette, notebookTextStyle } from "./Chart";
import bench from "@/data/bwai/bench.json";

type Throughput = { instances: number; fps: number };

function formatFps(v: number): string {
  return v > 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
}

export function BwaiBench() {
  const p = useNotebookPalette();
  const option = useMemo<echarts.EChartsOption>(() => {
    const rows = bench.throughput as Throughput[];
    const xs = rows.map((r) => String(r.instances));
    const fps = rows.map((r) => r.fps);

    return {
      textStyle: notebookTextStyle(p),
      backgroundColor: "transparent",
      animationDuration: 1000,
      animationEasing: "cubicOut",
      grid: { left: 56, right: 32, top: 36, bottom: 44 },
      tooltip: {
        trigger: "axis",
        backgroundColor: p.paper,
        borderColor: p.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle(p), fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ axisValue: string; value: number }>;
          const row = arr[0];
          if (!row) return "";
          return `<strong>${row.axisValue} instances</strong><br/>${row.value.toLocaleString()} fps`;
        },
      },
      xAxis: {
        type: "category",
        data: xs,
        name: "parallel instances",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { lineStyle: { color: p.inkSoft } },
        axisTick: { lineStyle: { color: p.inkSoft } },
        axisLabel: { color: p.inkSoft },
      },
      yAxis: {
        type: "value",
        name: "fps",
        nameLocation: "middle",
        nameGap: 52,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { show: false },
        axisLabel: {
          color: p.inkSoft,
          formatter: (v: number) => formatFps(v),
        },
        splitLine: { lineStyle: { color: p.ink, opacity: 0.08 } },
      },
      series: [
        {
          type: "line",
          data: fps,
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: { color: p.cyan, width: 2.4 },
          itemStyle: { color: p.cyan },
          areaStyle: { color: p.cyan, opacity: 0.1 },
          emphasis: { scale: 1.6 },
          animationDelay: (i: number) => i * 80,
          label: {
            show: true,
            position: "top",
            color: p.ink,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            formatter: (params: { value?: unknown }) => formatFps(Number(params.value)),
          },
        },
      ],
    };
  }, [p]);

  return (
    <Chart
      option={option}
      height={300}
      ariaLabel="Throughput in frames per second vs number of parallel instances"
    />
  );
}
