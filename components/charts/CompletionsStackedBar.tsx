"use client";

import { accentCssVars, getAreaAccent } from "@/lib/areaColors";
import { isoWeekLabel } from "@/lib/dates";
import type { CompletionWeekPoint } from "@/lib/dashboardQueries";
import { ChartCard, EmptyState, Legend, TooltipBox, TooltipRow } from "./primitives";
import { useIsDarkMode } from "./useIsDarkMode";
import { useMarkTooltip } from "./useMarkTooltip";

const OTHER_VARS = { ["--accent-light" as string]: "#898781", ["--accent-dark" as string]: "#898781" };

export default function CompletionsStackedBar({
  weeks,
  seriesOrder,
  areaNames,
}: {
  weeks: CompletionWeekPoint[];
  seriesOrder: string[]; // 7 core silos in canonical order + "other"
  areaNames: Record<string, string>;
}) {
  const { containerRef, hover, showAt, hide } = useMarkTooltip<{ week: string; seriesKey: string; value: number }>();
  const isDark = useIsDarkMode();

  const present = seriesOrder.filter((k) => weeks.some((w) => (w.bySilo[k] ?? 0) > 0));
  const maxTotal = Math.max(1, ...weeks.map((w) => Object.values(w.bySilo).reduce((s, v) => s + v, 0)));

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">Week</th>
          {present.map((k) => (
            <th key={k} className="py-1 pr-2 text-right font-medium">
              {k === "other" ? "Other" : areaNames[k] ?? k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((w) => (
          <tr key={w.week} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{w.week}</td>
            {present.map((k) => (
              <td key={k} className="viz-tabular py-1.5 pr-2 text-right">
                {w.bySilo[k] ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (weeks.length === 0) {
    return (
      <ChartCard
        title="Completions per week"
        caption="Follow-ups marked done, by silo. Trend history begins at deploy — earlier periods are blank by design."
        table={table}
      >
        <EmptyState message="No completions logged yet — this fills in as follow-ups are marked done." />
      </ChartCard>
    );
  }

  const legendItems = present.map((k) => ({
    key: k,
    label: k === "other" ? "Other" : areaNames[k] ?? k,
    color: k === "other" ? "#898781" : isDark ? getAreaAccent(k).dark : getAreaAccent(k).light,
  }));

  return (
    <ChartCard
      title="Completions per week"
      caption="Follow-ups marked done, by silo. Trend history begins at deploy — earlier periods are blank by design."
      table={table}
    >
      <div ref={containerRef} className="relative flex h-48 items-stretch gap-2 overflow-x-auto pb-5">
        {weeks.map((w) => {
          const total = Object.values(w.bySilo).reduce((s, v) => s + v, 0);
          const colHeightPct = (total / maxTotal) * 100;
          return (
            <div key={w.week} className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full flex-col-reverse" style={{ height: `${colHeightPct}%`, minHeight: total > 0 ? 2 : 0 }}>
                {present.map((k, segIdx) => {
                  const v = w.bySilo[k] ?? 0;
                  if (v <= 0) return null;
                  const segPct = (v / total) * 100;
                  const isTop = segIdx === present.filter((kk) => (w.bySilo[kk] ?? 0) > 0).length - 1;
                  return (
                    <div
                      key={k}
                      className="silo-accent w-full"
                      style={{
                        ...(k === "other" ? OTHER_VARS : (accentCssVars(k) as React.CSSProperties)),
                        backgroundColor: "var(--accent)",
                        height: `${segPct}%`,
                        borderRadius: isTop ? "4px 4px 0 0" : undefined,
                        marginBottom: 2,
                      }}
                      tabIndex={0}
                      role="img"
                      aria-label={`${k === "other" ? "Other" : areaNames[k] ?? k}, week of ${isoWeekLabel(w.week)}: ${v} completed`}
                      onMouseEnter={(e) => showAt(e, `${w.week}-${k}`, { week: w.week, seriesKey: k, value: v })}
                      onMouseLeave={hide}
                      onFocus={(e) => showAt(e, `${w.week}-${k}`, { week: w.week, seriesKey: k, value: v })}
                      onBlur={hide}
                    />
                  );
                })}
              </div>
              <span className="viz-tabular text-[10px] text-neutral-500 dark:text-neutral-400">{w.week.slice(6)}</span>
            </div>
          );
        })}
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <TooltipRow
              color={hover.data.seriesKey === "other" ? "#898781" : isDark ? getAreaAccent(hover.data.seriesKey).dark : getAreaAccent(hover.data.seriesKey).light}
              label={`${hover.data.seriesKey === "other" ? "Other" : areaNames[hover.data.seriesKey] ?? hover.data.seriesKey} · ${isoWeekLabel(hover.data.week)}`}
              value={`${hover.data.value}`}
            />
          </TooltipBox>
        )}
      </div>
      <Legend items={legendItems} />
    </ChartCard>
  );
}
