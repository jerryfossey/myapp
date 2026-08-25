"use client";

import { useRouter } from "next/navigation";
import { currentIsoWeek, isoWeekLabel, shiftIsoWeek } from "@/lib/dates";

export default function WeekSelector({ week }: { week: string }) {
  const router = useRouter();

  function go(nextWeek: string) {
    router.push(`/dashboard?week=${nextWeek}#time`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        aria-label="Previous week"
        onClick={() => go(shiftIsoWeek(week, -1))}
        className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        ‹
      </button>
      <span className="viz-tabular min-w-[9rem] text-center font-medium text-neutral-900 dark:text-white">
        {week} <span className="font-normal text-neutral-500">({isoWeekLabel(week)})</span>
      </span>
      <button
        type="button"
        aria-label="Next week"
        onClick={() => go(shiftIsoWeek(week, 1))}
        className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        ›
      </button>
      {week !== currentIsoWeek() && (
        <button
          type="button"
          onClick={() => go(currentIsoWeek())}
          className="ml-1 text-xs font-medium text-neutral-500 underline underline-offset-2"
        >
          This week
        </button>
      )}
    </div>
  );
}
