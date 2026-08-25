"use client";

import { fmtDollars } from "@/lib/chartFormat";
import type { BhagSnapshotPoint } from "@/lib/dashboardQueries";
import { ChartCard, EmptyState, Legend, TooltipBox, TooltipRow } from "./primitives";
import { useMarkTooltip } from "./useMarkTooltip";

const W = 640;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };

export default function BhagLineChart({ points }: { points: BhagSnapshotPoint[] }) {
  const { containerRef, hover, showAt, hide } = useMarkTooltip<BhagSnapshotPoint>();

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">As of</th>
          <th className="py-1 text-right font-medium">Cash on hand</th>
          <th className="py-1 text-right font-medium">HELOC balance</th>
          <th className="py-1 text-right font-medium">Cash target</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p, i) => (
          <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{p.asOf}</td>
            <td className="viz-tabular py-1.5 text-right">{fmtDollars(p.cashOnHand)}</td>
            <td className="viz-tabular py-1.5 text-right">{fmtDollars(p.helocBalance)}</td>
            <td className="viz-tabular py-1.5 text-right">{fmtDollars(p.cashTarget)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (points.length < 2) {
    return (
      <ChartCard
        title="BHAG progress"
        caption="Cash on hand climbing toward target; HELOC balance trending toward zero. Trend history begins at deploy — earlier periods are blank by design."
        table={table}
      >
        <EmptyState message="Not enough snapshots yet — this fills in as BHAG data is imported." />
      </ChartCard>
    );
  }

  const target = points[points.length - 1].cashTarget;
  const maxVal = Math.max(target, ...points.map((p) => p.cashOnHand), ...points.map((p) => p.helocBalance)) * 1.05;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;

  const cashPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.cashOnHand)}`).join(" ");
  const helocPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.helocBalance)}`).join(" ");
  const targetY = y(target);

  const legendItems = [
    { key: "cash", label: "Cash on hand", color: "var(--viz-diverging-neg)" },
    { key: "heloc", label: "HELOC balance", color: "var(--viz-diverging-pos)" },
  ];

  return (
    <ChartCard
      title="BHAG progress"
      caption="Cash on hand climbing toward target; HELOC balance trending toward zero. Trend history begins at deploy — earlier periods are blank by design."
      table={table}
    >
      <div ref={containerRef} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="BHAG progress line chart">
          <line x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY} stroke="var(--viz-baseline)" strokeWidth={1} />
          <text x={W - PAD.right} y={targetY - 4} textAnchor="end" style={{ fill: "var(--viz-text-muted)", fontSize: 9 }}>
            Target {fmtDollars(target)}
          </text>

          <path d={cashPath} fill="none" stroke="var(--viz-diverging-neg)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={helocPath} fill="none" stroke="var(--viz-diverging-pos)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.cashOnHand)} r={4} fill="var(--viz-diverging-neg)" stroke="var(--viz-surface)" strokeWidth={2} />
              <circle cx={x(i)} cy={y(p.helocBalance)} r={4} fill="var(--viz-diverging-pos)" stroke="var(--viz-surface)" strokeWidth={2} />
              {/* shared hit target for both series at this x */}
              <rect
                x={x(i) - 12}
                y={PAD.top}
                width={24}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${p.asOf}: cash ${fmtDollars(p.cashOnHand)}, HELOC ${fmtDollars(p.helocBalance)}`}
                onMouseEnter={(e) => showAt(e, String(i), p)}
                onMouseLeave={hide}
                onFocus={(e) => showAt(e, String(i), p)}
                onBlur={hide}
              />
            </g>
          ))}

          {(() => {
            const last = points[points.length - 1];
            const li = points.length - 1;
            // Anchored "end" and placed left of the final point, growing
            // into the plot area — anchoring right of the point risks
            // clipping against the SVG's own edge (viewBox overflow is
            // hidden by default) for a wide dollar figure.
            return (
              <>
                <text x={x(li) - 8} y={y(last.cashOnHand) - 8} textAnchor="end" style={{ fill: "var(--viz-text-secondary)", fontSize: 9 }}>
                  {fmtDollars(last.cashOnHand)}
                </text>
                <text x={x(li) - 8} y={y(last.helocBalance) + 14} textAnchor="end" style={{ fill: "var(--viz-text-secondary)", fontSize: 9 }}>
                  {fmtDollars(last.helocBalance)}
                </text>
              </>
            );
          })()}
        </svg>
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <div className="space-y-1">
              <div className="text-neutral-500 dark:text-neutral-400">{hover.data.asOf}</div>
              <TooltipRow color="var(--viz-diverging-neg)" label="Cash on hand" value={fmtDollars(hover.data.cashOnHand)} />
              <TooltipRow color="var(--viz-diverging-pos)" label="HELOC balance" value={fmtDollars(hover.data.helocBalance)} />
            </div>
          </TooltipBox>
        )}
      </div>
      <Legend items={legendItems} />
    </ChartCard>
  );
}
