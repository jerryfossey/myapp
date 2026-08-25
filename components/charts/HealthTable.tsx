"use client";

import { useState } from "react";
import SiloDot from "@/components/SiloDot";
import type { SiloHealth } from "@/lib/dashboardQueries";

type SortKey = "areaName" | "openCount" | "doneCount" | "delegatedCount" | "oldestUntouchedAgeDays" | "overdueReportCount";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "areaName", label: "Silo", align: "left" },
  { key: "openCount", label: "Open", align: "right" },
  { key: "doneCount", label: "Done", align: "right" },
  { key: "delegatedCount", label: "Delegated", align: "right" },
  { key: "oldestUntouchedAgeDays", label: "Oldest", align: "right" },
  { key: "overdueReportCount", label: "Overdue reports", align: "right" },
];

export default function HealthTable({ rows }: { rows: SiloHealth[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("oldestUntouchedAgeDays");
  const [dir, setDir] = useState<1 | -1>(-1);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setDir((d) => (d === 1 ? -1 : 1) as 1 | -1);
    } else {
      setSortKey(key);
      setDir(-1);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? -1;
    const bv = b[sortKey] ?? -1;
    if (typeof av === "string" || typeof bv === "string") {
      return dir * String(av).localeCompare(String(bv));
    }
    return dir * ((av as number) - (bv as number));
  });

  return (
    <div className="viz-root card overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Silo health</h3>
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr className="text-neutral-500">
            {COLUMNS.map((c) => (
              <th key={c.key} className={`py-1.5 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                <button
                  type="button"
                  onClick={() => sortBy(c.key)}
                  className="inline-flex items-center gap-0.5 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {c.label}
                  {sortKey === c.key && <span aria-hidden="true">{dir === 1 ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.areaId} className="border-t border-neutral-100 dark:border-neutral-800">
              <td className="py-1.5 pr-2">
                <span className="flex items-center gap-1.5">
                  <SiloDot areaId={r.areaId} />
                  {r.areaName}
                  {r.stalling && (
                    <span
                      title="Stalling: 14+ days untouched"
                      aria-label="stalling"
                      className="text-[10px] text-red-500 dark:text-red-400"
                    >
                      ●
                    </span>
                  )}
                </span>
              </td>
              <td className="viz-tabular py-1.5 text-right">{r.openCount}</td>
              <td className="viz-tabular py-1.5 text-right">{r.doneCount}</td>
              <td className="viz-tabular py-1.5 text-right">{r.delegatedCount}</td>
              <td className="viz-tabular py-1.5 text-right">
                {r.oldestUntouchedAgeDays === null ? "—" : `${r.oldestUntouchedAgeDays}d`}
              </td>
              <td className="py-1.5 text-right">
                {r.overdueReportCount > 0 ? (
                  <span className="badge bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {r.overdueReportCount}
                  </span>
                ) : (
                  <span className="viz-tabular text-neutral-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
