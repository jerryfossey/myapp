"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DependencyVM } from "@/lib/types";

export type SiblingOption = { id: string; item: string };

export default function DependenciesPanel({
  followUpId,
  blockedBy,
  siblingOptions,
}: {
  followUpId: string;
  blockedBy: DependencyVM[];
  siblingOptions?: SiblingOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeBlockers = blockedBy.filter((b) => !b.done);
  const available = (siblingOptions ?? []).filter(
    (o) => o.id !== followUpId && !blockedBy.some((b) => b.dependsOnId === o.id)
  );

  function removeDependency(id: string) {
    startTransition(async () => {
      await fetch(`/api/dependencies/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  function addDependency() {
    if (!selected) return;
    startTransition(async () => {
      const res = await fetch(`/api/followups/${followUpId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependsOnId: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong");
        return;
      }
      setError(null);
      setPicking(false);
      setSelected("");
      router.refresh();
    });
  }

  if (activeBlockers.length === 0 && (!siblingOptions || available.length === 0) && !picking) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {activeBlockers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeBlockers.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            >
              🔗 blocked by: {b.item}
              {siblingOptions && (
                <button
                  aria-label="Remove dependency"
                  disabled={isPending}
                  onClick={() => removeDependency(b.id)}
                  className="ml-0.5 text-amber-500 hover:text-amber-800 dark:hover:text-amber-100"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {siblingOptions &&
        (!picking ? (
          available.length > 0 && (
            <button
              className="text-xs font-medium text-neutral-500 underline underline-offset-2"
              onClick={() => setPicking(true)}
            >
              + Depends on
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <select
              autoFocus
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">Choose a subtask…</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.item}
                </option>
              ))}
            </select>
            <button className="btn-primary px-3 py-1.5 text-sm" disabled={!selected || isPending} onClick={addDependency}>
              Add
            </button>
            <button
              className="btn-secondary px-3 py-1.5 text-sm"
              onClick={() => {
                setPicking(false);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        ))}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
