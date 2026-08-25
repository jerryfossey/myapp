"use client";

export type RecurrenceDraft = {
  type: "fixed" | "afterComplete";
  interval: string; // kept as string for the input; parsed on submit
  unit: "days" | "weeks" | "months";
  start: string; // ISO date
};

export function defaultRecurrenceDraft(start: string): RecurrenceDraft {
  return { type: "fixed", interval: "1", unit: "months", start };
}

const fieldClass =
  "w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export default function RecurrenceFields({
  value,
  onChange,
}: {
  value: RecurrenceDraft;
  onChange: (next: RecurrenceDraft) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-neutral-300 p-2.5 dark:border-neutral-700">
      <select
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value as RecurrenceDraft["type"] })}
        className={fieldClass}
      >
        <option value="fixed">Fixed schedule (e.g. the 1st of every month)</option>
        <option value="afterComplete">Days after marked done</option>
      </select>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-neutral-500">Every</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={value.interval}
          onChange={(e) => onChange({ ...value, interval: e.target.value })}
          className={`${fieldClass} w-16`}
        />
        <select
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value as RecurrenceDraft["unit"] })}
          className={`${fieldClass} flex-1`}
        >
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-neutral-500">Start date</span>
        <input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className={`${fieldClass} flex-1`}
        />
      </div>
    </div>
  );
}
