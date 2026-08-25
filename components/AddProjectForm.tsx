"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AddProjectForm({ areaId }: { areaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setName("");
    setDueDate("");
    setOpen(false);
  }

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId, name: name.trim(), dueDate: dueDate || null }),
      });
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        + Add project
      </button>
    );
  }

  return (
    <div className="card space-y-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        placeholder="Due date (optional)"
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      />
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={isPending || !name.trim()} onClick={submit}>
          Add
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={reset}>
          Cancel
        </button>
      </div>
    </div>
  );
}
