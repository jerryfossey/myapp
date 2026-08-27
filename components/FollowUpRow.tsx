"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FollowUpVM } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { describeRecurrence } from "@/lib/recurrence";
import RecurrenceFields, { defaultRecurrenceDraft, RecurrenceDraft } from "./RecurrenceFields";
import StepsChecklist from "./StepsChecklist";
import DependenciesPanel, { SiblingOption } from "./DependenciesPanel";

async function patchFollowUp(id: string, body: unknown) {
  const res = await fetch(`/api/followups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("request failed");
  return res.json();
}

export default function FollowUpRow({
  followUp,
  showArea = true,
  siblingOptions,
}: {
  followUp: FollowUpVM;
  showArea?: boolean;
  siblingOptions?: SiblingOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<
    "delegate" | "priority" | "note" | "notes" | "schedule" | "due" | "recurrence" | null
  >(null);
  const [delegateTo, setDelegateTo] = useState("");
  const [priorityInput, setPriorityInput] = useState(followUp.priority?.toString() ?? "");
  const [noteText, setNoteText] = useState("");
  const [scheduleInput, setScheduleInput] = useState(followUp.scheduledFor ?? "");
  const [dueInput, setDueInput] = useState(followUp.dueDate ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceDraft>(
    followUp.recurrence
      ? { type: followUp.recurrence.type, interval: String(followUp.recurrence.interval), unit: followUp.recurrence.unit, start: followUp.recurrence.start }
      : defaultRecurrenceDraft(followUp.scheduledFor ?? "")
  );

  function run(body: unknown) {
    startTransition(async () => {
      await patchFollowUp(followUp.id, body);
      setExpanded(null);
      setDelegateTo("");
      setNoteText("");
      router.refresh();
    });
  }

  const ageColor = followUp.stale
    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
    : followUp.ageDays >= 7
    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";

  const isDone = followUp.status === "done";

  return (
    <div className={`card ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{followUp.item}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            {showArea && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                {followUp.areaName}
              </span>
            )}
            <span>
              waiting on <strong className="font-medium text-neutral-700 dark:text-neutral-300">{followUp.waitingOn}</strong>
            </span>
            {followUp.status === "delegated" && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                delegated
              </span>
            )}
            {followUp.scheduledFor && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {formatDate(new Date(followUp.scheduledFor))}
              </span>
            )}
            {followUp.dueDate && (
              <span
                className={`rounded-full px-2 py-0.5 ${
                  followUp.dueOverdue
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                due {formatDate(new Date(followUp.dueDate))}
              </span>
            )}
            {followUp.recurrence && (
              <span
                title={describeRecurrence(followUp.recurrence)}
                className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
              >
                ↻ {describeRecurrence(followUp.recurrence)}
              </span>
            )}
          </div>
        </div>
        <span className={`badge shrink-0 ${ageColor}`}>{followUp.ageDays}d</span>
      </div>

      <DependenciesPanel followUpId={followUp.id} blockedBy={followUp.blockedBy} siblingOptions={siblingOptions} />

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">→ {followUp.nextAction}</p>
      <StepsChecklist followUpId={followUp.id} steps={followUp.steps} editable={!isDone} />

      {followUp.notes.length > 0 && (
        <button
          onClick={() => setExpanded(expanded === "notes" ? null : "notes")}
          className="mt-2 text-xs font-medium text-neutral-500 underline underline-offset-2"
        >
          {followUp.notes.length} note{followUp.notes.length > 1 ? "s" : ""}
        </button>
      )}
      {expanded === "notes" && (
        <ul className="mt-2 space-y-1.5 border-l-2 border-neutral-200 pl-3 dark:border-neutral-800">
          {followUp.notes.map((n) => (
            <li key={n.id} className="text-xs text-neutral-500">
              <span className="text-neutral-400">{new Date(n.at).toLocaleDateString()}</span> — {n.text}
            </li>
          ))}
        </ul>
      )}

      {!isDone && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary" disabled={isPending} onClick={() => run({ action: "followed-up" })}>
            Followed up
          </button>
          <button className="btn-secondary" disabled={isPending} onClick={() => run({ action: "done" })}>
            Done
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => setExpanded(expanded === "delegate" ? null : "delegate")}
          >
            Delegate
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => setExpanded(expanded === "priority" ? null : "priority")}
          >
            Reprioritize
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => setExpanded(expanded === "note" ? null : "note")}
          >
            Add note
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => {
              setScheduleInput(followUp.scheduledFor ?? "");
              setExpanded(expanded === "schedule" ? null : "schedule");
            }}
          >
            {followUp.scheduledFor ? "Reschedule" : "Schedule"}
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => {
              setDueInput(followUp.dueDate ?? "");
              setExpanded(expanded === "due" ? null : "due");
            }}
          >
            {followUp.dueDate ? "Change due date" : "Due date"}
          </button>
          <button
            className="btn-secondary"
            disabled={isPending}
            onClick={() => {
              setRecurrence(
                followUp.recurrence
                  ? {
                      type: followUp.recurrence.type,
                      interval: String(followUp.recurrence.interval),
                      unit: followUp.recurrence.unit,
                      start: followUp.recurrence.start,
                    }
                  : defaultRecurrenceDraft(followUp.scheduledFor ?? "")
              );
              setExpanded(expanded === "recurrence" ? null : "recurrence");
            }}
          >
            {followUp.recurrence ? "Edit repeat" : "Repeat"}
          </button>
        </div>
      )}

      {expanded === "delegate" && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={delegateTo}
            onChange={(e) => setDelegateTo(e.target.value)}
            placeholder="Delegate to…"
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-primary"
            disabled={!delegateTo.trim() || isPending}
            onClick={() => run({ action: "delegate", delegateTo: delegateTo.trim() })}
          >
            Set
          </button>
        </div>
      )}

      {expanded === "priority" && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={priorityInput}
            onChange={(e) => setPriorityInput(e.target.value)}
            placeholder="Rank (blank = unranked)"
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-primary"
            disabled={isPending}
            onClick={() =>
              run({ action: "reprioritize", priority: priorityInput.trim() === "" ? null : Number(priorityInput) })
            }
          >
            Set
          </button>
        </div>
      )}

      {expanded === "note" && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Note…"
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-primary"
            disabled={!noteText.trim() || isPending}
            onClick={() => run({ action: "add-note", text: noteText.trim() })}
          >
            Save
          </button>
        </div>
      )}

      {expanded === "schedule" && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="date"
            value={scheduleInput}
            onChange={(e) => setScheduleInput(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-primary"
            disabled={isPending}
            onClick={() => run({ action: "reschedule", scheduledFor: scheduleInput || null })}
          >
            Set
          </button>
          {followUp.scheduledFor && (
            <button
              className="btn-secondary"
              disabled={isPending}
              onClick={() => {
                setScheduleInput("");
                run({ action: "reschedule", scheduledFor: null });
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {expanded === "due" && (
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
            onClick={() => run({ action: "set-due-date", dueDate: dueInput || null })}
          >
            Set
          </button>
          {followUp.dueDate && (
            <button
              className="btn-secondary"
              disabled={isPending}
              onClick={() => {
                setDueInput("");
                run({ action: "set-due-date", dueDate: null });
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {expanded === "recurrence" && (
        <div className="mt-3 space-y-2">
          <RecurrenceFields value={recurrence} onChange={setRecurrence} />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              disabled={isPending || !recurrence.start || !Number.isInteger(Number(recurrence.interval)) || Number(recurrence.interval) < 1}
              onClick={() =>
                run({
                  action: "set-recurrence",
                  recurrence: {
                    type: recurrence.type,
                    interval: Number(recurrence.interval),
                    unit: recurrence.unit,
                    start: recurrence.start,
                  },
                })
              }
            >
              Set
            </button>
            {followUp.recurrence && (
              <button
                className="btn-secondary"
                disabled={isPending}
                onClick={() => run({ action: "set-recurrence", recurrence: null })}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
