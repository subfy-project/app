"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { BarChart3 } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────── */

export interface RevenueChartDataPoint {
  label: string;
  value: number;
}

export interface RevenueChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title — defaults to "Revenue Overview" */
  title?: string;
  /** Chart data points */
  data?: RevenueChartDataPoint[];
  /** Y-axis max value — auto-calculated if omitted */
  yMax?: number;
  /** Number of Y-axis ticks (including 0) — defaults to 5 */
  yTicks?: number;
  /** Stroke color — defaults to main-500 */
  strokeColor?: string;
  /** Gradient fill color (rgba) — defaults to main-500 at 25% */
  fillColor?: string;
}

/* ──────────────────────────────────────────────────────────
 * Default demo data (matches Figma screenshot)
 * ──────────────────────────────────────────────────────── */

const defaultData: RevenueChartDataPoint[] = [
  { label: "Jan", value: 200 },
  { label: "Feb", value: 400 },
  { label: "Mar", value: 700 },
  { label: "Avr", value: 750 },
  { label: "May", value: 500 },
  { label: "Jun", value: 800 },
  { label: "Jul", value: 900 },
];

/* ──────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────── */

/** Build a smooth cubic-bezier SVG path from points */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

/* ──────────────────────────────────────────────────────────
 * RevenueChart
 *
 * Figma node 208:2130
 *
 * Card: neutral-900 bg, dark-500 border, rounded-2xl
 * Title: Outfit Regular 18px, text-secondary (#837F8D)
 * Axis labels: Outfit Regular 12px, text-secondary
 * Line: main-500, 2px stroke
 * Fill: main-500 → transparent gradient below line
 * ──────────────────────────────────────────────────────── */

const RevenueChart = React.forwardRef<HTMLDivElement, RevenueChartProps>(
  (
    {
      className,
      title = "Revenue Overview",
      data = defaultData,
      yMax: yMaxProp,
      yTicks = 5,
      strokeColor = "#8B7CFF",
      fillColor = "rgba(139,124,255,0.15)",
      ...props
    },
    ref
  ) => {
    /* Compute Y-axis */
    const rawMax = yMaxProp ?? Math.max(...data.map((d) => d.value));
    const yMax = Math.ceil(rawMax / 250) * 250 || 1000;

    const tickValues: number[] = [];
    for (let i = 0; i < yTicks; i++) {
      tickValues.push(Math.round((yMax / (yTicks - 1)) * i));
    }
    tickValues.reverse(); // top → bottom: 1000, 750, 500, 250, 0

    /* SVG dimensions (viewBox) */
    const svgW = 600;
    const svgH = 200;
    const padL = 0;
    const padR = 0;
    const padT = 4;
    const padB = 4;

    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;

    /* Map data → SVG points */
    const points = data.map((d, i) => ({
      x: padL + (i / (data.length - 1)) * chartW,
      y: padT + chartH - (d.value / yMax) * chartH,
    }));

    const linePath = smoothPath(points);

    /* Closed path for gradient fill */
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${svgH} L ${points[0].x} ${svgH} Z`;

    /* Horizontal dashed grid lines */
    const gridLines = tickValues.map((v) => {
      const y = padT + chartH - (v / yMax) * chartH;
      return { y, value: v };
    });

    const gradientId = React.useId();

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-dark-500 bg-neutral-900 px-6 pb-6 pt-4",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6 text-main-500" />
          <span className="font-outfit text-[18px] font-normal text-text-secondary">
            {title}
          </span>
        </div>

        {/* Chart area */}
        <div className="flex flex-1 gap-1 min-h-0">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between font-outfit text-[12px] text-text-secondary shrink-0 py-1">
            {tickValues.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>

          {/* SVG chart + X-axis */}
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            <div className="relative flex-1 min-h-[160px]">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                preserveAspectRatio="none"
                className="absolute inset-0 size-full"
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {gridLines.map((g) => (
                  <line
                    key={g.value}
                    x1={padL}
                    y1={g.y}
                    x2={svgW}
                    y2={g.y}
                    stroke="#25293A"
                    strokeWidth={1}
                    strokeDasharray="6 4"
                  />
                ))}

                {/* Area fill */}
                <path d={fillPath} fill={`url(#${gradientId})`} />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between font-outfit text-[12px] text-text-secondary">
              {data.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RevenueChart.displayName = "RevenueChart";

export { RevenueChart };
