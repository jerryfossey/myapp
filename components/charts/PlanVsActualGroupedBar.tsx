"use client";

import type { TimeCategoryPoint } from "@/lib/dashboardQueries";
import { ChartCard, Legend, TooltipBox, TooltipRow } from "./primitives";
import { useMarkTooltip } from "./useMarkTooltip";

export default function PlanVsActualGroupedBar({ categories }: { categories: TimeCategoryPoint[] }) {
  const { containerRef, hover, showAt, hide } = useMarkTooltip<{ c: TimeCategoryPoint; series: "planned" | "actual" }>();
  const maxVal = Math.max(1, ...categories.map((c) => Math.max(c.planned, c.actual ?? 0)));

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">Category</th>
          <th className="py-1 text-right font-medium">Planned</th>
          <th className="py-1 text-right font-medium">Actual</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((c) => (
          <tr key={c.categoryId} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{c.label}</td>
            <td className="viz-tabular py-1.5 text-right">{c.planned.toFixed(1)}h</td>
            <td className="viz-tabular py-1.5 text-right">{c.actual === null ? "—" : `${c.actual.toFixed(1)}h`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <ChartCard title="Plan vs. actual, this week" caption="Planned allocation is provisional and editable; actual is pushed from timesheets." table={table}>
      <div ref={containerRef} className="relative space-y-3">
        {categories.map((c) => (
          <div key={c.categoryId} className="grid grid-cols-[110px_1fr] items-center gap-2 text-xs">
            <span className="truncate text-neutral-700 dark:text-neutral-300" title={c.label}>
              {c.label}
            </span>
            <div className="space-y-1">
              <BarRow
                widthPct={(c.planned / maxVal) * 100}
                color="var(--viz-baseline)"
                valueText={`${c.planned.toFixed(1)}h`}
                onEnter={(e) => showAt(e, `${c.categoryId}-planned`, { c, series: "planned" })}
                onLeave={hide}
              />
              {c.actual === null ? (
                <div className="text-[10px] text-neutral-400">no data yet</div>
              ) : (
                <BarRow
                  widthPct={(c.actual / maxVal) * 100}
                  color="var(--viz-diverging-neg)"
                  valueText={`${c.actual.toFixed(1)}h`}
                  onEnter={(e) => showAt(e, `${c.categoryId}-actual`, { c, series: "actual" })}
                  onLeave={hide}
                />
              )}
            </div>
          </div>
        ))}
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <TooltipRow
              color={hover.data.series === "planned" ? "var(--viz-baseline)" : "var(--viz-diverging-neg)"}
              label={`${hover.data.c.label} · ${hover.data.series === "planned" ? "Planned" : "Actual"}`}
              value={`${(hover.data.series === "planned" ? hover.data.c.planned : hover.data.c.actual ?? 0).toFixed(1)}h`}
            />
          </TooltipBox>
        )}
      </div>
      <Legend
        items={[
          { key: "planned", label: "Planned", color: "var(--viz-baseline)" },
          { key: "actual", label: "Actual", color: "var(--viz-diverging-neg)" },
        ]}
      />
    </ChartCard>
  );
}

function BarRow({
  widthPct,
  color,
  valueText,
  onEnter,
  onLeave,
}: {
  widthPct: number;
  color: string;
  valueText: string;
  onEnter: (e: React.SyntheticEvent) => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 flex-1 rounded-sm bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-2 rounded-sm"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
          tabIndex={0}
          role="img"
          aria-label={valueText}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onEnter}
          onBlur={onLeave}
        />
      </div>
      <span className="viz-tabular w-10 shrink-0 text-right text-[10px] text-neutral-500">{valueText}</span>
    </div>
  );
}
