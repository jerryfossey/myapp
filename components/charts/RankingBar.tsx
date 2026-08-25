"use client";

import { accentCssVars } from "@/lib/areaColors";
import { STALE_THRESHOLD_DAYS } from "@/lib/derived";
import { ChartCard, TooltipBox, TooltipRow } from "./primitives";
import { useMarkTooltip } from "./useMarkTooltip";

export type RankingBarItem = { areaId: string; areaName: string; days: number };

// Hero chart: "Days since last touched, by silo". Horizontal bars, sorted
// longest-first, each bar in its silo accent. Bar-only by design — this is
// a ranking, not a share of a whole, so it never gets the Bar/Pie selector.
export default function RankingBar({ items }: { items: RankingBarItem[] }) {
  const sorted = [...items].sort((a, b) => b.days - a.days);
  const max = Math.max(1, ...sorted.map((d) => d.days));
  const { containerRef, hover, showAt, hide } = useMarkTooltip<RankingBarItem>();

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">Silo</th>
          <th className="py-1 text-right font-medium">Days since touched</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((d) => (
          <tr key={d.areaId} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{d.areaName}</td>
            <td className="viz-tabular py-1.5 text-right">{d.days}d</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <ChartCard
      title="Days since last touched, by silo"
      caption="Longest-idle silos first. A marker flags 14+ days stalling."
      table={table}
    >
      <div ref={containerRef} className="relative space-y-2.5">
        {sorted.map((d) => {
          const pct = (d.days / max) * 100;
          const stalling = d.days >= STALE_THRESHOLD_DAYS;
          return (
            <div key={d.areaId}>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                  {d.areaName}
                  {stalling && (
                    <span
                      aria-label="stalling: 14+ days untouched"
                      title="Stalling: 14+ days untouched"
                      className="text-[10px] text-red-500 dark:text-red-400"
                    >
                      ●
                    </span>
                  )}
                </span>
                <span className="viz-tabular">{d.days}d</span>
              </div>
              <div className="h-3.5 w-full rounded-sm bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="silo-accent h-3.5"
                  style={{
                    ...(accentCssVars(d.areaId) as React.CSSProperties),
                    width: `${pct}%`,
                    backgroundColor: "var(--accent)",
                    borderRadius: "0 4px 4px 0",
                  }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.areaName}: ${d.days} days since touched`}
                  onMouseEnter={(e) => showAt(e, d.areaId, d)}
                  onMouseLeave={hide}
                  onFocus={(e) => showAt(e, d.areaId, d)}
                  onBlur={hide}
                />
              </div>
            </div>
          );
        })}
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <TooltipRow color="currentColor" label={hover.data.areaName} value={`${hover.data.days}d`} />
          </TooltipBox>
        )}
      </div>
    </ChartCard>
  );
}
