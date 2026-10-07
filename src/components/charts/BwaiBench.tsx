"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, useNotebookPalette, notebookTextStyle } from "./Chart";
import bench from "@/data/bwai/bench.json";

type Throughput = { instances: number; fps: number };

function formatFps(v: number): string {
  return v >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
}

export function BwaiBench() {
  const p = useNotebookPalette();
  const option = useMemo<echarts.EChartsOption>(() => {
    const rows = bench.throughput as Throughput[];
    // measured points at their true instance counts; doubling steps are even
    // on a log2 axis, and 12 sits where 12 is
    const points = rows.map((r) => [r.instances, r.fps]);

    const baseOption: echarts.EChartsOption = {
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
          const arr = params as Array<{ value: [number, number] }>;
          const row = arr[0];
          if (!row) return "";
          const [n, f] = row.value;
          return `<strong>${n} instances</strong><br/>${f.toLocaleString()} fps`;
        },
      },
      xAxis: {
        type: "log",
        logBase: 2,
        min: 1,
        max: 16,
        name: "parallel instances",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: notebookTextStyle(p),
        axisLine: { lineStyle: { color: p.inkSoft } },
        axisTick: { lineStyle: { color: p.inkSoft } },
        axisLabel: { color: p.inkSoft },
        splitLine: { show: false },
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
          hideOverlap: true,
          formatter: (v: number) => formatFps(v),
        },
        splitLine: { lineStyle: { color: p.ink, opacity: 0.08 } },
      },
      series: [
        {
          type: "line",
          data: points,
          // straight segments: nothing was measured between the points
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
            formatter: (params: { value?: unknown }) => formatFps(Number((params.value as [number, number])[1])),
          },
        },
      ],
    };

    return {
      baseOption,
      media: [
        {
          query: { maxWidth: 520 },
          option: {
            grid: { left: 52, right: 44, top: 28, bottom: 44 },
            yAxis: { nameGap: 40 },
            // right of each point is below the rising line, so values never sit on it
            series: [{ label: { position: "right", distance: 6 } }],
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
