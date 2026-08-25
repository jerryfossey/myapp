"use client";

import { fmtSigned } from "@/lib/chartFormat";
import type { TimeCategoryPoint } from "@/lib/dashboardQueries";
import { ChartCard, TooltipBox, TooltipRow } from "./primitives";
import { useMarkTooltip } from "./useMarkTooltip";

// Diverging bar: actual-minus-planned hours, centered at zero. Overrun
// (red) on one side, underrun (blue) on the other. Signed values, so this
// never gets the Bar/Pie selector.
export default function VarianceBar({ categories }: { categories: TimeCategoryPoint[] }) {
  const { containerRef, hover, showAt, hide } = useMarkTooltip<TimeCategoryPoint>();

  const withData = categories.filter((c) => c.variance !== null);
  const noData = categories.filter((c) => c.variance === null);
  const sorted = [...withData].sort((a, b) => (b.variance ?? 0) - (a.variance ?? 0));
  const maxAbs = Math.max(1, ...withData.map((c) => Math.abs(c.variance ?? 0)));

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">Category</th>
          <th className="py-1 text-right font-medium">Planned</th>
          <th className="py-1 text-right font-medium">Actual</th>
          <th className="py-1 text-right font-medium">Variance</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((c) => (
          <tr key={c.categoryId} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{c.label}</td>
            <td className="viz-tabular py-1.5 text-right">{c.planned.toFixed(1)}h</td>
            <td className="viz-tabular py-1.5 text-right">{c.actual === null ? "—" : `${c.actual.toFixed(1)}h`}</td>
            <td className="viz-tabular py-1.5 text-right">{c.variance === null ? "no data" : fmtSigned(c.variance, "h")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <ChartCard title="Variance by category, this week" caption="Actual hours minus planned. Overrun right (red), underrun left (blue)." table={table}>
      <div ref={containerRef} className="relative space-y-1.5">
        {sorted.map((c) => {
          const v = c.variance ?? 0;
          const pct = (Math.abs(v) / maxAbs) * 50;
          const positive = v >= 0;
          return (
            <div key={c.categoryId} className="grid grid-cols-[110px_1fr_56px] items-center gap-2 text-xs">
              <span className="truncate text-neutral-700 dark:text-neutral-300" title={c.label}>
                {c.label}
              </span>
              <div className="relative h-4">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--viz-baseline)]" />
                <div
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    [positive ? "left" : "right"]: "50%",
                    width: `${pct}%`,
                    backgroundColor: positive ? "var(--viz-diverging-pos)" : "var(--viz-diverging-neg)",
                  }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${c.label}: ${fmtSigned(v, "h")} vs plan`}
                  onMouseEnter={(e) => showAt(e, c.categoryId, c)}
                  onMouseLeave={hide}
                  onFocus={(e) => showAt(e, c.categoryId, c)}
                  onBlur={hide}
                />
              </div>
              <span className="viz-tabular text-right text-neutral-600 dark:text-neutral-400">{fmtSigned(v, "h")}</span>
            </div>
          );
        })}
        {noData.map((c) => (
          <div key={c.categoryId} className="grid grid-cols-[110px_1fr_56px] items-center gap-2 text-xs opacity-50">
            <span className="truncate" title={c.label}>
              {c.label}
            </span>
            <div className="relative h-4">
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--viz-baseline)]" />
            </div>
            <span className="text-right text-neutral-400">no data</span>
          </div>
        ))}
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <TooltipRow
              color={(hover.data.variance ?? 0) >= 0 ? "var(--viz-diverging-pos)" : "var(--viz-diverging-neg)"}
              label={hover.data.label}
              value={fmtSigned(hover.data.variance ?? 0, "h")}
            />
          </TooltipBox>
        )}
      </div>
    </ChartCard>
  );
}
