"use client";

import { useMemo, useState } from "react";
import { FollowUpVM, ReportVM } from "@/lib/types";
import FollowUpRow from "./FollowUpRow";
import ReportRow from "./ReportRow";

type Filter = "all" | "mine" | "chasing";

export default function TodayView({
  followUps,
  overdueReports,
}: {
  followUps: FollowUpVM[];
  overdueReports: ReportVM[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "mine") return followUps.filter((f) => f.waitingOn.toLowerCase() === "me");
    if (filter === "chasing") return followUps.filter((f) => f.waitingOn.toLowerCase() !== "me");
    return followUps;
  }, [followUps, filter]);

  return (
    <div>
      {overdueReports.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
            Overdue reports ({overdueReports.length})
          </h2>
          <div className="space-y-2">
            {overdueReports.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
        {(
          [
            ["all", "All"],
            ["mine", "Do it"],
            ["chasing", "Chase it"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              filter === key
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">Nothing here. Clean plate.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((f) => (
            <FollowUpRow key={f.id} followUp={f} />
          ))}
        </div>
      )}
    </div>
  );
}
