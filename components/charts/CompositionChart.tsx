"use client";

import { accentCssVars, getAreaAccent } from "@/lib/areaColors";
import { fmtPercent } from "@/lib/chartFormat";
import { computeDonutArcs, labelPoint, textColorForFill } from "./donutMath";
import { useIsDarkMode } from "./useIsDarkMode";
import { BarPieToggle, ChartCard, Legend, TooltipBox, TooltipRow, useChartMode } from "./primitives";
import { useMarkTooltip } from "./useMarkTooltip";

export type CompositionSlice = { key: string; label: string; value: number; accentId: string };
export type CompositionUnit = "count" | "hours";

function formatValue(v: number, unit: CompositionUnit): string {
  return unit === "hours" ? `${v.toFixed(1)}h` : String(v);
}

const MAX_SLICES = 6;
const OTHER_ACCENT = { light: "#898781", dark: "#898781" }; // muted, identical in both modes

function resolveAccent(accentId: string) {
  return accentId === "other" ? OTHER_ACCENT : getAreaAccent(accentId);
}

function sliceVars(accentId: string): React.CSSProperties {
  const { light, dark } = resolveAccent(accentId);
  return { ["--accent-light" as string]: light, ["--accent-dark" as string]: dark } as React.CSSProperties;
}

// Folds anything past the top N slices (by value) into a single "Other"
// slice, so a pie never exceeds a readable count regardless of how many
// underlying entities feed it.
export function capSlices(slices: CompositionSlice[], max = MAX_SLICES): CompositionSlice[] {
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const head = sorted.slice(0, max);
  const rest = sorted.slice(max);
  const otherValue = rest.reduce((s, r) => s + r.value, 0);
  if (otherValue > 0) {
    head.push({ key: "other", label: "Other", value: otherValue, accentId: "other" });
  }
  return head;
}

// Composition chart with a Bar/Pie selector (this is for a "share of a
// whole at one point in time" only — never used for rankings or trends).
export default function CompositionChart({
  storageId,
  title,
  caption,
  slices,
  unit = "count",
}: {
  storageId: string;
  title: string;
  caption?: string;
  slices: CompositionSlice[];
  unit?: CompositionUnit;
}) {
  const [mode, setMode] = useChartMode(storageId);
  const isDark = useIsDarkMode();
  const capped = capSlices(slices);
  const total = capped.reduce((s, d) => s + d.value, 0);
  const valueLabel = (v: number) => formatValue(v, unit);
  const { containerRef, hover, showAt, hide } = useMarkTooltip<CompositionSlice>();

  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-neutral-500">
          <th className="py-1 pr-2 font-medium">Category</th>
          <th className="py-1 text-right font-medium">Value</th>
          <th className="py-1 text-right font-medium">Share</th>
        </tr>
      </thead>
      <tbody>
        {capped.map((s) => (
          <tr key={s.key} className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="py-1.5 pr-2">{s.label}</td>
            <td className="viz-tabular py-1.5 text-right">{valueLabel(s.value)}</td>
            <td className="viz-tabular py-1.5 text-right">{total > 0 ? fmtPercent(s.value / total) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const legendItems = capped.map((s) => {
    const accent = resolveAccent(s.accentId);
    return { key: s.key, label: s.label, color: isDark ? accent.dark : accent.light };
  });

  if (total === 0) {
    return (
      <ChartCard title={title} caption={caption} controls={<BarPieToggle mode={mode} onChange={setMode} />} table={table}>
        <p className="py-6 text-center text-xs text-neutral-400">No data yet.</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} caption={caption} controls={<BarPieToggle mode={mode} onChange={setMode} />} table={table}>
      <div ref={containerRef} className="relative">
        {mode === "bar" ? (
          <div className="space-y-2">
            {capped.map((s) => {
              const pct = (s.value / total) * 100;
              return (
                <div key={s.key}>
                  <div className="mb-1 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{s.label}</span>
                    <span className="viz-tabular">
                      {valueLabel(s.value)} · {fmtPercent(s.value / total)}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-sm bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="silo-accent h-3 rounded-sm"
                      style={{ ...sliceVars(s.accentId), width: `${pct}%`, backgroundColor: "var(--accent)" }}
                      tabIndex={0}
                      role="img"
                      aria-label={`${s.label}: ${valueLabel(s.value)}, ${fmtPercent(s.value / total)}`}
                      onMouseEnter={(e) => showAt(e, s.key, s)}
                      onMouseLeave={hide}
                      onFocus={(e) => showAt(e, s.key, s)}
                      onBlur={hide}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DonutChart slices={capped} total={total} valueLabel={valueLabel} isDark={isDark} showAt={showAt} hideTip={hide} />
        )}
        {hover && (
          <TooltipBox x={hover.x} y={hover.y}>
            <TooltipRow
              color={isDark ? resolveAccent(hover.data.accentId).dark : resolveAccent(hover.data.accentId).light}
              label={hover.data.label}
              value={`${valueLabel(hover.data.value)} · ${fmtPercent(hover.data.value / total)}`}
            />
          </TooltipBox>
        )}
      </div>
      <Legend items={legendItems} />
    </ChartCard>
  );
}

function DonutChart({
  slices,
  total,
  valueLabel,
  isDark,
  showAt,
  hideTip,
}: {
  slices: CompositionSlice[];
  total: number;
  valueLabel: (v: number) => string;
  isDark: boolean;
  showAt: (e: React.SyntheticEvent, key: string, data: CompositionSlice) => void;
  hideTip: () => void;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const ir = 54;
  const arcs = computeDonutArcs(
    slices.map((s) => s.value),
    r,
    ir,
    cx,
    cy
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block h-56 w-56" role="img" aria-label="Composition donut chart">
      {arcs.map((arc, i) => {
        const accent = resolveAccent(slices[i].accentId);
        const hex = isDark ? accent.dark : accent.light;
        return (
          <path
            key={slices[i].key}
            d={arc.path}
            fill={hex}
            stroke="var(--viz-surface)"
            strokeWidth={2}
            tabIndex={0}
            role="img"
            aria-label={`${slices[i].label}: ${valueLabel(slices[i].value)}, ${fmtPercent(slices[i].value / total)}`}
            onMouseEnter={(e) => showAt(e, slices[i].key, slices[i])}
            onMouseLeave={hideTip}
            onFocus={(e) => showAt(e, slices[i].key, slices[i])}
            onBlur={hideTip}
          />
        );
      })}
      {arcs.map((arc, i) => {
        const share = slices[i].value / total;
        if (share < 0.06) return null; // too thin to fit a direct label
        const accent = resolveAccent(slices[i].accentId);
        const hex = isDark ? accent.dark : accent.light;
        const [lx, ly] = labelPoint(cx, cy, (r + ir) / 2, arc.midAngle);
        return (
          <text
            key={`label-${slices[i].key}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            style={{ fill: textColorForFill(hex), fontSize: 8, fontWeight: 600 }}
          >
            {fmtPercent(share)}
          </text>
        );
      })}
    </svg>
  );
}
