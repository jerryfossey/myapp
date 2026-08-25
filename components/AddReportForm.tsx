"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const CADENCE_OPTIONS = ["weekly", "biweekly", "monthly", "quarterly"];

export default function AddReportForm({ areaId }: { areaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [owes, setOwes] = useState("");
  const [cadence, setCadence] = useState("weekly");

  function reset() {
    setPerson("");
    setOwes("");
    setCadence("weekly");
    setOpen(false);
  }

  function submit() {
    if (!person.trim() || !owes.trim()) return;
    startTransition(async () => {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId,
          person: person.trim(),
          owes: owes.trim(),
          cadence,
        }),
      });
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add report
      </button>
    );
  }

  return (
    <div className="card space-y-2">
      <input
        autoFocus
        value={person}
        onChange={(e) => setPerson(e.target.value)}
        placeholder="Who reports?"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        value={owes}
        onChange={(e) => setOwes(e.target.value)}
        placeholder="What they owe"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <select
        value={cadence}
        onChange={(e) => setCadence(e.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {CADENCE_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={isPending || !person.trim() || !owes.trim()} onClick={submit}>
          Add
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={reset}>
          Cancel
        </button>
      </div>
    </div>
  );
}
