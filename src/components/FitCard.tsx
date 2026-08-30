"use client";

import {
  Scatter,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { FitResult } from "@/lib/kinetics";

type Props = {
  fit: FitResult;
  isBest: boolean;
};

function fmt(n: number, digits = 4) {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) !== 0 && (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e5)) {
    return n.toExponential(3);
  }
  return n.toFixed(digits);
}

export default function FitCard({ fit, isBest }: Props) {
  const chartData = fit.points.map((p) => ({ x: p.x, y: p.y }));

  return (
    <div
      className={`relative rounded-sm border bg-[var(--card-bg)] p-4 shadow-[2px_3px_0_var(--grid-line-strong)] ${
        isBest ? "border-[var(--highlight)]" : "border-[var(--grid-line-strong)]"
      }`}
    >
      {isBest && (
        <div
          className="absolute -top-3 right-4 rotate-[-3deg] rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink)] shadow-sm"
          style={{ background: "var(--highlight)" }}
        >
          Best fit
        </div>
      )}

      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <span className="font-display text-lg font-semibold">{fit.label}</span>
          <span className="ml-2 font-data text-xs text-[var(--ink-soft)]">
            n = {fit.order}
          </span>
        </div>
        <span className="font-data text-xs text-[var(--ink-soft)]">
          {fit.yLabel} vs {fit.xLabel}
        </span>
      </div>

      {!fit.valid ? (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--ink-soft)]">
          {fit.error ?? "Not enough data."}
        </div>
      ) : (
        <>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid stroke="var(--grid-line)" />
                <XAxis
                  dataKey="x"
                  type="number"
                  tick={{ fontSize: 11, fontFamily: "var(--font-data)", fill: "var(--ink-soft)" }}
                  stroke="var(--grid-line-strong)"
                  label={{
                    value: fit.xLabel,
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                    fill: "var(--ink-soft)",
                  }}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  tick={{ fontSize: 11, fontFamily: "var(--font-data)", fill: "var(--ink-soft)" }}
                  stroke="var(--grid-line-strong)"
                  width={44}
                  label={{
                    value: fit.yLabel,
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "var(--ink-soft)",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "var(--font-data)",
                    fontSize: 12,
                    borderRadius: 2,
                    borderColor: "var(--grid-line-strong)",
                  }}
                  formatter={(value) => fmt(Number(value), 4)}
                />
                <Scatter
                  data={chartData}
                  fill={isBest ? "var(--highlight)" : "var(--teal)"}
                  shape="circle"
                />
                <Line
                  data={fit.line}
                  dataKey="y"
                  type="linear"
                  stroke={isBest ? "var(--rust)" : "var(--ink-soft)"}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-data text-sm">
            <span className="text-[var(--ink-soft)]">slope</span>
            <span>{fmt(fit.slope)}</span>
            <span className="text-[var(--ink-soft)]">intercept</span>
            <span>{fmt(fit.intercept)}</span>
            <span className="text-[var(--ink-soft)]">R\u00B2</span>
            <span>{fmt(fit.r2, 5)}</span>
            <span className="text-[var(--ink-soft)]">k</span>
            <span className="font-semibold">{fmt(fit.k)}</span>
            <span className="text-[var(--ink-soft)]">C\u2080 (from fit)</span>
            <span>{fmt(fit.c0)}</span>
          </div>
        </>
      )}
    </div>
  );
}
