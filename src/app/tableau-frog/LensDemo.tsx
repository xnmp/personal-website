"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ECharts } from "echarts";
import {
  generateSignups,
  PLANS,
  AGE_BIN_LABELS,
  ageBinOf,
  type Row,
} from "./lib/data";
import { groupContrasts, foldMultiple, type GroupContrast } from "./lib/contrast";
import { divergingColor, INK_MUTED, AXIS } from "./lib/color";

const MONO = "var(--tf-mono), ui-monospace, monospace";

type Caption =
  | { kind: "idle" }
  | {
      kind: "active";
      n: number;
      top: GroupContrast;
      dir: "up" | "down";
    };

const axisCommon = {
  axisLine: { lineStyle: { color: AXIS } },
  axisTick: { show: false },
  axisLabel: { color: INK_MUTED, fontFamily: MONO, fontSize: 10 },
  splitLine: { show: false },
  nameTextStyle: { color: INK_MUTED, fontFamily: MONO, fontSize: 10 },
};

export default function LensDemo() {
  const rows = useMemo<Row[]>(() => generateSignups(2000), []);
  const scatterRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);

  const scatterChart = useRef<ECharts | null>(null);
  const planChart = useRef<ECharts | null>(null);
  const ageChart = useRef<ECharts | null>(null);

  const [caption, setCaption] = useState<Caption>({ kind: "idle" });
  const [ready, setReady] = useState(false);

  // group assignments for the responders (computed once)
  const planGroup = useMemo(() => {
    const g = new Int32Array(rows.length);
    rows.forEach((r, i) => (g[i] = r.plan));
    return g;
  }, [rows]);
  const ageGroup = useMemo(() => {
    const g = new Int32Array(rows.length);
    rows.forEach((r, i) => (g[i] = ageBinOf(r.age)));
    return g;
  }, [rows]);

  const planCounts = useMemo(() => {
    const c = new Array(PLANS.length).fill(0);
    rows.forEach((r) => (c[r.plan] += 1));
    return c;
  }, [rows]);
  const ageCounts = useMemo(() => {
    const c = new Array(AGE_BIN_LABELS.length).fill(0);
    rows.forEach((r) => (c[ageBinOf(r.age)] += 1));
    return c;
  }, [rows]);

  useEffect(() => {
    let disposed = false;
    let cleanupAuto: (() => void) | undefined;

    (async () => {
      const echarts = await import("echarts");
      if (disposed || !scatterRef.current || !planRef.current || !ageRef.current) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

      const scatter = echarts.init(scatterRef.current, undefined, { renderer: "canvas" });
      const plan = echarts.init(planRef.current, undefined, { renderer: "canvas" });
      const age = echarts.init(ageRef.current, undefined, { renderer: "canvas" });
      scatterChart.current = scatter;
      planChart.current = plan;
      ageChart.current = age;

      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __tfScatter?: ECharts }).__tfScatter = scatter;
      }

      // ---- scatter (the source panel; brush lives here) ----
      const points = rows.map((r) => [r.age, r.sessionMinutes]);
      scatter.setOption({
        animation: false,
        backgroundColor: "transparent",
        grid: { left: 44, right: 14, top: 14, bottom: 34 },
        xAxis: { ...axisCommon, type: "value", name: "age", nameLocation: "middle", nameGap: 22, min: 16, max: 70 },
        yAxis: { ...axisCommon, type: "value", name: "session_minutes", nameLocation: "middle", nameGap: 34, min: 0 },
        brush: {
          xAxisIndex: 0,
          yAxisIndex: 0,
          brushType: "rect",
          brushMode: "single",
          transformable: true,
          throttleType: "debounce",
          throttleDelay: 80,
          brushStyle: {
            borderWidth: 1,
            color: "rgba(57,135,229,0.10)",
            borderColor: "rgba(57,135,229,0.9)",
          },
          inBrush: { opacity: 1 },
          outOfBrush: { colorAlpha: 0.14 },
          removeOnClick: true,
        },
        toolbox: { showTitle: false, itemSize: 0, feature: { brush: { type: ["rect", "clear"] } } },
        series: [
          {
            type: "scatter",
            data: points,
            symbolSize: 6,
            itemStyle: {
              color: "#3987e5",
              opacity: 0.55,
              borderColor: "rgba(255,255,255,0.35)",
              borderWidth: 0,
            },
            emphasis: { disabled: true },
          },
        ],
      });

      // enable rect brush cursor by default
      scatter.dispatchAction({
        type: "takeGlobalCursor",
        key: "brush",
        brushOption: { brushType: "rect", brushMode: "single" },
      });

      const baseBar = (labels: string[], counts: number[], name: string) => ({
        animation: true,
        animationDuration: 200,
        backgroundColor: "transparent",
        grid: { left: 40, right: 12, top: 10, bottom: 30 },
        xAxis: { ...axisCommon, type: "category", data: labels, name, nameLocation: "middle", nameGap: 20, axisLabel: { ...axisCommon.axisLabel, interval: 0, hideOverlap: true } },
        yAxis: { ...axisCommon, type: "value" },
        series: [
          {
            type: "bar",
            data: counts.map((v) => ({ value: v, itemStyle: { color: "#2c4a63" } })),
            barWidth: "62%",
            itemStyle: { borderRadius: [2, 2, 0, 0] },
          },
        ],
      });
      plan.setOption(baseBar([...PLANS], planCounts, "plan"));
      age.setOption(baseBar([...AGE_BIN_LABELS], ageCounts, "age"));

      // ---- the recolour function ----
      const recolour = (mask: Uint8Array | null) => {
        if (!mask) {
          plan.setOption({ series: [{ data: planCounts.map((v) => ({ value: v, itemStyle: { color: "#2c4a63" } })) }] });
          age.setOption({ series: [{ data: ageCounts.map((v) => ({ value: v, itemStyle: { color: "#2c4a63" } })) }] });
          setCaption({ kind: "idle" });
          return;
        }
        const planC = groupContrasts([...PLANS], planGroup, mask);
        const ageC = groupContrasts([...AGE_BIN_LABELS], ageGroup, mask);
        const paint = (cs: GroupContrast[], counts: number[]) =>
          counts.map((v, i) => ({
            value: v,
            itemStyle: {
              color: divergingColor(cs[i].t),
              opacity: cs[i].trusted ? 1 : 0.35,
            },
          }));
        plan.setOption({ series: [{ data: paint(planC, planCounts) }] });
        age.setOption({ series: [{ data: paint(ageC, ageCounts) }] });

        const n = mask.reduce((s, v) => s + v, 0);
        if (n === 0) {
          setCaption({ kind: "idle" });
          return;
        }
        // headline = the strongest *over*-represented significant group (the
        // intuitive read); fall back to the most extreme contrast either way.
        const all = [...planC, ...ageC].filter((c) => c.trusted);
        const over = all.filter((c) => c.t > 0 && c.significant);
        const top = over.length
          ? over.reduce((a, b) => (b.t > a.t ? b : a))
          : all.reduce((a, b) => (Math.abs(b.t) > Math.abs(a.t) ? b : a));
        setCaption({ kind: "active", n, top, dir: top.t >= 0 ? "up" : "down" });
      };

      scatter.on("brushSelected", (params: unknown) => {
        const p = params as { batch?: Array<{ selected?: Array<{ dataIndex: number[] }> }> };
        const sel = p.batch?.[0]?.selected?.[0]?.dataIndex ?? [];
        if (!sel.length) {
          recolour(null);
          return;
        }
        const mask = new Uint8Array(rows.length);
        for (const i of sel) mask[i] = 1;
        recolour(mask);
      });

      const onResize = () => {
        scatter.resize();
        plan.resize();
        age.resize();
      };
      window.addEventListener("resize", onResize);
      setReady(true);

      // ---- auto-demo on touch / coarse pointers ----
      if (touch || reduce) {
        const rects: Array<[[number, number], [number, number]]> = [
          [[32, 52], [64, 190]], // pro power cloud
          [[18, 30], [0, 44]], // young + short sessions (free skew)
          [[40, 60], [50, 130]], // team-ish
        ];
        let idx = 0;
        const drive = () => {
          const [[x0, x1], [y0, y1]] = rects[idx % rects.length];
          scatter.dispatchAction({
            type: "brush",
            areas: [{ brushType: "rect", xAxisIndex: 0, yAxisIndex: 0, coordRange: [[x0, x1], [y0, y1]] }],
          });
          idx += 1;
        };
        drive();
        if (!reduce) {
          const t = window.setInterval(drive, 2800);
          cleanupAuto = () => window.clearInterval(t);
        }
      }

      cleanupAuto = ((prev) => () => {
        prev?.();
        window.removeEventListener("resize", onResize);
      })(cleanupAuto);
    })();

    return () => {
      disposed = true;
      cleanupAuto?.();
      scatterChart.current?.dispose();
      planChart.current?.dispose();
      ageChart.current?.dispose();
      scatterChart.current = planChart.current = ageChart.current = null;
    };
  }, [rows, planGroup, ageGroup, planCounts, ageCounts]);

  return (
    <div>
      <div className="tf-demo">
        <div className="tf-panel" aria-label="Source scatter panel: age versus session minutes. Brush to select a cohort.">
          <div className="tf-panel-head">
            <span className="tf-panel-title">session_minutes × age</span>
            <span className="tf-badge source">source · brush me</span>
          </div>
          <div className="tf-slots">
            <span className="tf-slot">x <b>age</b></span>
            <span className="tf-slot">y <b>session_minutes</b></span>
            <span className="tf-slot">z <b>—</b></span>
          </div>
          <div ref={scatterRef} className="tf-chartbox" style={{ height: 300 }} />
        </div>

        <div className="tf-demo-side">
          <div className="tf-panel">
            <div className="tf-panel-head">
              <span className="tf-panel-title">plan</span>
              <span className="tf-badge responder">responder · contrast</span>
            </div>
            <div ref={planRef} className="tf-chartbox" style={{ height: 150 }} />
          </div>
          <div className="tf-panel">
            <div className="tf-panel-head">
              <span className="tf-panel-title">age distribution</span>
              <span className="tf-badge responder">responder · contrast</span>
            </div>
            <div ref={ageRef} className="tf-chartbox" style={{ height: 150 }} />
          </div>
        </div>
      </div>

      <div className="tf-caption" role="status" aria-live="polite">
        {caption.kind === "idle" ? (
          <span className="dim">
            Drag a box across the scatter — every panel recolours by how over- or under-represented its groups are in your selection. Each colour is significance-tested.
          </span>
        ) : (
          <>
            <span>
              <span className="n">n={caption.n}</span> selected —{" "}
              <b>{caption.top.label}</b> is{" "}
              <span className={caption.dir === "up" ? "up" : "down"}>
                {foldMultiple(caption.top).toFixed(1)}× {caption.dir === "up" ? "over" : "under"}-represented
              </span>{" "}
              <span className="dim">
                (p{caption.top.p < 0.001 ? " < 0.001" : ` = ${caption.top.p.toFixed(3)}`}
                {caption.top.significant ? ", q < 0.05 ✓" : ", n.s."})
              </span>
            </span>
          </>
        )}
        <span className="tf-legend" style={{ marginLeft: "auto" }}>
          under
          <span className="bar" />
          over
        </span>
      </div>
      {!ready && (
        <div className="tf-demo-hint">Loading interactive demo…</div>
      )}
    </div>
  );
}
