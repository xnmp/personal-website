"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, notebookPalette, notebookTextStyle } from "./Chart";
import q2 from "@/data/eskiv/q2.json";

type Bucket = {
  label: string;
  samples: number;
  w: number;
  h: number;
  data: [number, number, number][];
};

export function EskivQ2() {
  const option = useMemo<echarts.EChartsOption>(() => {
    const buckets = q2.buckets as Bucket[];
    const w = buckets[0].w;
    const h = buckets[0].h;

    const baseOption: echarts.EChartsOption = {
      textStyle: notebookTextStyle,
      backgroundColor: "transparent",
      tooltip: {
        backgroundColor: notebookPalette.paper,
        borderColor: notebookPalette.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle, fontSize: 13 },
        formatter: (params: unknown) => {
          const p = params as { data: [number, number, number]; marker: string };
          return `${p.marker} density: ${p.data[2].toFixed(1)}`;
        },
      },
      grid: { left: 14, right: 14, top: 44, bottom: 92, containLabel: false },
      xAxis: {
        type: "category",
        data: Array.from({ length: w }, (_, i) => i),
        show: false,
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: Array.from({ length: h }, (_, i) => i),
        inverse: true,
        show: false,
        splitArea: { show: false },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: false,
        show: false,
        inRange: {
          color: [
            notebookPalette.paper,
            "#f5e3b0",
            notebookPalette.amber,
            notebookPalette.rust,
            "#2d1b0e",
          ],
        },
      },
    };

    return {
      ...baseOption,
      baseOption,
      timeline: {
        axisType: "category",
        data: buckets.map((b) => b.label),
        autoPlay: true,
        playInterval: 1400,
        loop: true,
        symbol: "none",
        lineStyle: { color: notebookPalette.inkSoft, opacity: 0.3 },
        label: {
          color: notebookPalette.inkSoft,
          fontSize: 11,
          fontFamily: "var(--font-mono), monospace",
        },
        itemStyle: { color: notebookPalette.inkSoft, opacity: 0.4 },
        checkpointStyle: {
          color: notebookPalette.cyan,
          borderColor: notebookPalette.cyan,
          symbol: "circle",
          symbolSize: 12,
        },
        progress: {
          lineStyle: { color: notebookPalette.cyan, width: 2 },
          itemStyle: { color: notebookPalette.cyan, opacity: 0.9 },
          label: { color: notebookPalette.cyan },
        },
        controlStyle: {
          color: notebookPalette.ink,
          borderColor: notebookPalette.ink,
        },
        bottom: 8,
        left: 40,
        right: 40,
      },
      options: buckets.map((bucket) => ({
        title: {
          text: `score ${bucket.label}`,
          subtext: `${bucket.samples.toLocaleString()} steps`,
          left: "center",
          top: 8,
          textStyle: {
            ...notebookTextStyle,
            fontSize: 14,
            fontWeight: 500,
          },
          subtextStyle: {
            ...notebookTextStyle,
            fontSize: 11,
            color: notebookPalette.inkSoft,
            fontFamily: "var(--font-mono), monospace",
          },
        },
        series: [
          {
            type: "heatmap",
            data: bucket.data,
            progressive: 0,
            animation: true,
            animationDuration: 800,
            animationEasing: "cubicOut",
            itemStyle: { borderWidth: 0 },
            emphasis: { itemStyle: { borderColor: notebookPalette.ink, borderWidth: 1 } },
          },
        ],
      })),
    };
  }, []);

  return <Chart option={option} height={560} ariaLabel="Player position density by score" />;
}
