"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RecurrenceFields, { defaultRecurrenceDraft, RecurrenceDraft } from "./RecurrenceFields";

type AreaOption = { id: string; name: string };

export default function AddFollowUpForm({
  areaId,
  areas,
  defaultDate,
  projectId,
  label = "+ Add follow-up",
}: {
  areaId?: string;
  areas?: AreaOption[];
  defaultDate?: string | null;
  projectId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(areaId ?? areas?.[0]?.id ?? "");
  const [item, setItem] = useState("");
  const [waitingOn, setWaitingOn] = useState("me");
  const [nextAction, setNextAction] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultDate ?? "");
  const [repeats, setRepeats] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceDraft>(defaultRecurrenceDraft(defaultDate ?? ""));

  function reset() {
    setItem("");
    setWaitingOn("me");
    setNextAction("");
    setScheduledFor(defaultDate ?? "");
    setRepeats(false);
    setRecurrence(defaultRecurrenceDraft(defaultDate ?? ""));
    setOpen(false);
  }

  function submit() {
    const targetArea = areaId ?? selectedArea;
    const interval = Number(recurrence.interval);
    if (!targetArea || !item.trim() || !nextAction.trim()) return;
    if (repeats && (!recurrence.start || !Number.isInteger(interval) || interval < 1)) return;
    startTransition(async () => {
      await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: targetArea,
          projectId: projectId ?? null,
          item: item.trim(),
          waitingOn: waitingOn.trim() || "me",
          nextAction: nextAction.trim(),
          scheduledFor: scheduledFor || null,
          recurrence: repeats
            ? { type: recurrence.type, interval, unit: recurrence.unit, start: recurrence.start }
            : null,
        }),
      });
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        {label}
      </button>
    );
  }

  return (
    <div className="card space-y-2">
      {areas && !areaId && (
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <input
        autoFocus
        value={item}
        onChange={(e) => setItem(e.target.value)}
        placeholder="What needs to happen?"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        value={nextAction}
        onChange={(e) => setNextAction(e.target.value)}
        placeholder="Next action"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        value={waitingOn}
        onChange={(e) => setWaitingOn(e.target.value)}
        placeholder="Waiting on (defaults to me)"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        type="date"
        value={scheduledFor}
        onChange={(e) => setScheduledFor(e.target.value)}
        placeholder="Schedule for (optional)"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      />
      <label className="flex items-center gap-2 py-1 text-sm text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={repeats}
          onChange={(e) => {
            setRepeats(e.target.checked);
            if (e.target.checked && !recurrence.start) {
              setRecurrence({ ...recurrence, start: scheduledFor || defaultDate || "" });
            }
          }}
        />
        Repeats
      </label>
      {repeats && <RecurrenceFields value={recurrence} onChange={setRecurrence} />}
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={isPending || !item.trim() || !nextAction.trim()}
          onClick={submit}
        >
          Add
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={reset}>
          Cancel
        </button>
      </div>
    </div>
  );
}
