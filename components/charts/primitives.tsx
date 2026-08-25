"use client";

import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "@/lib/clientStorage";

// ---------------------------------------------------------------------------
// Bar/Pie mode toggle — localStorage-persisted per chart, composition
// charts only (per the dataviz brief's chart-type selector rule).
// ---------------------------------------------------------------------------

export type ChartMode = "bar" | "pie";

export function useChartMode(storageId: string, fallback: ChartMode = "bar") {
  const storageKey = `silos:chart:${storageId}:mode`;
  const [mode, setModeState] = useState<ChartMode>(fallback);

  useEffect(() => {
    setModeState(readJSON<ChartMode>(storageKey, fallback));
    // Only re-read when the chart identity changes, not every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function setMode(next: ChartMode) {
    setModeState(next);
    writeJSON(storageKey, next);
  }

  return [mode, setMode] as const;
}

export function BarPieToggle({ mode, onChange }: { mode: ChartMode; onChange: (m: ChartMode) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-900" role="group" aria-label="Chart type">
      {(["bar", "pie"] as ChartMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            mode === m
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
              : "text-neutral-500"
          }`}
        >
          {m === "bar" ? "Bar" : "Pie"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart card — title/caption chrome + the table-view accessibility twin.
// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  caption,
  controls,
  table,
  children,
}: {
  title: string;
  caption?: string;
  controls?: React.ReactNode;
  table: React.ReactNode;
  children: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="viz-root card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
          {caption && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{caption}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {controls}
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 underline underline-offset-2"
          >
            {showTable ? "Chart" : "Table"}
          </button>
        </div>
      </div>
      {showTable ? table : children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend — always present for >=2 series; a dot for categorical, a short
// line-key style is used inline in tooltips instead (see TooltipRow).
// ---------------------------------------------------------------------------

export function Legend({ items }: { items: { key: string; label: string; color: string }[] }) {
  if (items.length < 2) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
      {items.map((it) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip — positioned absolutely inside a `position: relative` container.
// Values lead (Strong), series name follows; keyed with a short color
// stroke rather than a filled box, per interaction.md.
// ---------------------------------------------------------------------------

export function TooltipBox({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-800"
      style={{ left: x, top: y - 10 }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden="true" className="inline-block h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="viz-tabular font-semibold text-neutral-900 dark:text-white">{value}</span>
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — trend charts render this until history accrues.
// ---------------------------------------------------------------------------

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
      {message}
    </div>
  );
}
