"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReportVM } from "@/lib/types";

const STATUS_STYLES: Record<ReportVM["displayStatus"], string> = {
  in: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  due: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  done: "bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-800",
};

export default function ReportRow({ report, showArea = true }: { report: ReportVM; showArea?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [flagging, setFlagging] = useState(false);

  function patch(body: unknown) {
    startTransition(async () => {
      await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  return (
    <div className={`card ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {report.person}
            {showArea && <span className="ml-2 text-xs font-normal text-neutral-500">· {report.areaName}</span>}
          </p>
          <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{report.owes}</p>
          <p className="text-xs text-neutral-400">{report.cadence}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`badge ${STATUS_STYLES[report.displayStatus]}`}>{report.displayStatus}</span>
        </div>
      </div>

      {report.displayStatus !== "done" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary" disabled={isPending} onClick={() => patch({ action: "received" })}>
            Received
          </button>
          <button className="btn-secondary" disabled={isPending} onClick={() => setFlagging(!flagging)}>
            Flag
          </button>
          <button className="btn-secondary" disabled={isPending} onClick={() => patch({ action: "done" })}>
            Archive
          </button>
        </div>
      )}

      {flagging && (
        <div className="mt-2 flex gap-2">
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => {
              setFlagging(false);
              patch({ action: "flag", status: "due" });
            }}
          >
            Mark due
          </button>
          <button
            className="btn-danger"
            disabled={isPending}
            onClick={() => {
              setFlagging(false);
              patch({ action: "flag", status: "overdue" });
            }}
          >
            Mark overdue
          </button>
        </div>
      )}
    </div>
  );
}
