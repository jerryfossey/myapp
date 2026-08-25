"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectVM } from "@/lib/types";
import { formatDate } from "@/lib/format";
import FollowUpRow from "./FollowUpRow";
import AddFollowUpForm from "./AddFollowUpForm";

export default function ProjectCard({ project }: { project: ProjectVM }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingDue, setEditingDue] = useState(false);
  const [dueInput, setDueInput] = useState(project.dueDate ?? "");
  const [showDone, setShowDone] = useState(false);

  function patch(body: unknown) {
    startTransition(async () => {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditingDue(false);
      router.refresh();
    });
  }

  const total = project.openCount + project.doneCount + project.delegatedCount;
  const open = project.subtasks.filter((s) => s.status !== "done");
  const done = project.subtasks.filter((s) => s.status === "done");

  return (
    <div className={`card ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{project.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            <span className="viz-tabular rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              {project.doneCount}/{total} done
            </span>
            {project.dueDate && (
              <span
                className={`rounded-full px-2 py-0.5 ${
                  project.atRisk
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {project.atRisk ? "at risk · " : ""}due {formatDate(new Date(project.dueDate))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {open.length === 0 && <p className="text-sm text-neutral-500">No open subtasks.</p>}
        {open.map((f) => (
          <FollowUpRow key={f.id} followUp={f} showArea={false} />
        ))}
        <AddFollowUpForm areaId={project.areaId} projectId={project.id} label="+ Add subtask" />
      </div>

      {done.length > 0 && (
        <button
          onClick={() => setShowDone(!showDone)}
          className="mt-3 text-xs font-medium text-neutral-500 underline underline-offset-2"
        >
          {showDone ? "Hide" : "Show"} done ({done.length})
        </button>
      )}
      {showDone && (
        <div className="mt-2 space-y-2">
          {done.map((f) => (
            <FollowUpRow key={f.id} followUp={f} showArea={false} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-secondary"
          disabled={isPending}
          onClick={() => {
            setDueInput(project.dueDate ?? "");
            setEditingDue(!editingDue);
          }}
        >
          {project.dueDate ? "Change due date" : "Due date"}
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => patch({ action: "archive" })}>
          Archive
        </button>
      </div>

      {editingDue && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="date"
            value={dueInput}
            onChange={(e) => setDueInput(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-primary"
            disabled={isPending}
            onClick={() => patch({ action: "set-due-date", dueDate: dueInput || null })}
          >
            Set
          </button>
          {project.dueDate && (
            <button
              className="btn-secondary"
              disabled={isPending}
              onClick={() => {
                setDueInput("");
                patch({ action: "set-due-date", dueDate: null });
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
