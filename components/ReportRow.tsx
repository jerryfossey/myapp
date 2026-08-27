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
  const [editing, setEditing] = useState(false);
  const [editPerson, setEditPerson] = useState(report.person);
  const [editOwes, setEditOwes] = useState(report.owes);
  const [editCadence, setEditCadence] = useState(report.cadence);

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
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`badge ${STATUS_STYLES[report.displayStatus]}`}>{report.displayStatus}</span>
          <button
            className="text-xs font-medium text-neutral-400 underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300"
            disabled={isPending}
            onClick={() => {
              setEditPerson(report.person);
              setEditOwes(report.owes);
              setEditCadence(report.cadence);
              setEditing(!editing);
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <input
            autoFocus
            value={editPerson}
            onChange={(e) => setEditPerson(e.target.value)}
            placeholder="Who reports?"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <input
            value={editOwes}
            onChange={(e) => setEditOwes(e.target.value)}
            placeholder="What they owe"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <input
            value={editCadence}
            onChange={(e) => setEditCadence(e.target.value)}
            placeholder="Cadence"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              disabled={isPending || !editPerson.trim() || !editOwes.trim() || !editCadence.trim()}
              onClick={() => {
                setEditing(false);
                patch({ action: "edit", person: editPerson.trim(), owes: editOwes.trim(), cadence: editCadence.trim() });
              }}
            >
              Save
            </button>
            <button className="btn-secondary" disabled={isPending} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
