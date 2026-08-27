"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepVM } from "@/lib/types";

function patchStep(id: string, body: unknown) {
  return fetch(`/api/steps/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function StepsChecklist({
  followUpId,
  steps,
  editable,
}: {
  followUpId: string;
  steps: StepVM[];
  editable: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStep, setNewStep] = useState("");

  function run(fn: () => Promise<Response>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function addStep() {
    const text = newStep.trim();
    if (!text) return;
    setNewStep("");
    run(() =>
      fetch(`/api/followups/${followUpId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
    );
  }

  if (steps.length === 0 && !editable) return null;

  return (
    <div className={`mt-2 space-y-1 ${isPending ? "opacity-60" : ""}`}>
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.done}
            disabled={!editable || isPending}
            onChange={() => run(() => patchStep(s.id, { action: "toggle" }))}
            className="shrink-0"
          />
          <span
            className={`min-w-0 flex-1 ${
              s.done ? "text-neutral-400 line-through" : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {s.text}
          </span>
          {editable && (
            <div className="flex shrink-0 gap-2 text-neutral-400">
              <button
                aria-label="Move step up"
                disabled={isPending || i === 0}
                onClick={() => run(() => patchStep(s.id, { action: "move", direction: "up" }))}
                className="disabled:opacity-30"
              >
                ↑
              </button>
              <button
                aria-label="Move step down"
                disabled={isPending || i === steps.length - 1}
                onClick={() => run(() => patchStep(s.id, { action: "move", direction: "down" }))}
                className="disabled:opacity-30"
              >
                ↓
              </button>
              <button
                aria-label="Delete step"
                disabled={isPending}
                onClick={() => run(() => fetch(`/api/steps/${s.id}`, { method: "DELETE" }))}
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}
      {editable && (
        <div className="flex gap-2 pt-1">
          <input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addStep();
            }}
            placeholder="+ Add step"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            className="btn-secondary px-3 py-1.5 text-sm"
            disabled={!newStep.trim() || isPending}
            onClick={addStep}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
