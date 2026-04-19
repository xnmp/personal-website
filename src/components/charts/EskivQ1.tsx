"use client";
import { useMemo } from "react";
import * as echarts from "echarts";
import { Chart, notebookPalette, notebookTextStyle } from "./Chart";
import q1 from "@/data/eskiv/q1.json";

type Row = { bucket: number; count: number; mean: number; p25: number; p75: number };

export function EskivQ1() {
  const option = useMemo<echarts.EChartsOption>(() => {
    const rows = q1.rows as Row[];
    const xs = rows.map((r) => r.bucket);
    const mean = rows.map((r) => r.mean);
    const p25 = rows.map((r) => r.p25);
    const bandHeight = rows.map((r) => r.p75 - r.p25);
    const counts = rows.map((r) => r.count);

    return {
      textStyle: notebookTextStyle,
      backgroundColor: "transparent",
      animationDuration: 1200,
      animationEasing: "cubicOut",
      grid: { left: 64, right: 64, top: 36, bottom: 52 },
      legend: {
        data: [
          { name: "IQR (p25–p75)", icon: "rect" },
          { name: "mean path ratio", icon: "circle" },
          { name: "samples", icon: "rect" },
        ],
        bottom: 4,
        textStyle: { ...notebookTextStyle, fontSize: 12 },
        itemGap: 22,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: notebookPalette.paper,
        borderColor: notebookPalette.ink,
        borderWidth: 1,
        textStyle: { ...notebookTextStyle, fontSize: 13 },
        formatter: (params: unknown) => {
          const arr = params as Array<{
            axisValue: number;
            seriesName: string;
            value: number;
          }>;
          const x = arr[0]?.axisValue;
          const row = rows.find((r) => r.bucket === x);
          if (!row) return "";
          return [
            `<strong>${row.bucket}–${row.bucket + 9} balls</strong>`,
            `mean ratio: ${row.mean.toFixed(3)}`,
            `IQR: ${row.p25.toFixed(3)} – ${row.p75.toFixed(3)}`,
            `samples: ${row.count.toLocaleString()}`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: xs,
        name: "number of balls at pickup",
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: notebookTextStyle,
        axisLine: { lineStyle: { color: notebookPalette.inkSoft } },
        axisTick: { lineStyle: { color: notebookPalette.inkSoft } },
        axisLabel: { color: notebookPalette.inkSoft },
      },
      yAxis: [
        {
          type: "value",
          min: 0,
          max: 1,
          name: "path ratio (1 = straight)",
          nameLocation: "middle",
          nameGap: 44,
          nameTextStyle: notebookTextStyle,
          axisLine: { show: false },
          axisLabel: { color: notebookPalette.inkSoft },
          splitLine: { lineStyle: { color: notebookPalette.ink, opacity: 0.08 } },
        },
        {
          type: "value",
          name: "samples",
          nameLocation: "middle",
          nameGap: 44,
          nameTextStyle: notebookTextStyle,
          position: "right",
          axisLine: { show: false },
          axisLabel: {
            color: notebookPalette.inkSoft,
            formatter: (v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "samples",
          type: "bar",
          yAxisIndex: 1,
          data: counts,
          barWidth: "70%",
          itemStyle: {
            color: notebookPalette.olive,
            opacity: 0.18,
          },
          animationDelay: (i: number) => i * 40,
          animationDuration: 600,
        },
        {
          name: "p25",
          type: "line",
          data: p25,
          stack: "band",
          symbol: "none",
          lineStyle: { opacity: 0 },
          silent: true,
          showInLegend: false,
        },
        {
          name: "IQR (p25–p75)",
          type: "line",
          data: bandHeight,
          stack: "band",
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { color: notebookPalette.cyan, opacity: 0.22 },
          animationDelay: (i: number) => 300 + i * 30,
        },
        {
          name: "mean path ratio",
          type: "line",
          data: mean,
          smooth: 0.25,
          symbol: "circle",
          symbolSize: 8,
          itemStyle: { color: notebookPalette.cyan },
          lineStyle: { color: notebookPalette.cyan, width: 2.4 },
          emphasis: { scale: 1.6 },
          animationDelay: (i: number) => 600 + i * 60,
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { type: "dashed", color: notebookPalette.inkSoft, opacity: 0.5 },
            data: [{ yAxis: 1 }],
            label: { show: false },
          },
        },
      ],
    };
  }, []);

  return <Chart option={option} height={380} ariaLabel="Path ratio vs number of balls" />;
}
