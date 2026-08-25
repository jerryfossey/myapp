"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AreaOption = { id: string; name: string };

export default function AddFollowUpForm({
  areaId,
  areas,
}: {
  areaId?: string;
  areas?: AreaOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(areaId ?? areas?.[0]?.id ?? "");
  const [item, setItem] = useState("");
  const [waitingOn, setWaitingOn] = useState("me");
  const [nextAction, setNextAction] = useState("");

  function reset() {
    setItem("");
    setWaitingOn("me");
    setNextAction("");
    setOpen(false);
  }

  function submit() {
    const targetArea = areaId ?? selectedArea;
    if (!targetArea || !item.trim() || !nextAction.trim()) return;
    startTransition(async () => {
      await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: targetArea,
          item: item.trim(),
          waitingOn: waitingOn.trim() || "me",
          nextAction: nextAction.trim(),
        }),
      });
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add follow-up
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
