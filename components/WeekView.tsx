"use client";

import { FollowUpVM } from "@/lib/types";
import { formatDayLabel } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";
import AddFollowUpForm from "./AddFollowUpForm";
import SiloGroupedList, { ListMode } from "./SiloGroupedList";
import ViewModeToggle from "./ViewModeToggle";
import { useSiloViewState } from "@/lib/useSiloViewState";

type AreaOption = { id: string; name: string };

function DaySection({
  title,
  items,
  areas,
  defaultDate,
  tone,
  mode,
  collapsed,
  onToggleSection,
}: {
  title: string;
  items: FollowUpVM[];
  areas: AreaOption[];
  defaultDate?: string | null;
  tone?: "overdue" | "muted";
  mode: ListMode;
  collapsed: Set<string>;
  onToggleSection: (areaId: string) => void;
}) {
  return (
    <section className="mb-5">
      <h2
        className={`mb-2 text-sm font-semibold ${
          tone === "overdue"
            ? "text-red-700 dark:text-red-400"
            : tone === "muted"
            ? "text-neutral-400"
            : "text-neutral-700 dark:text-neutral-300"
        }`}
      >
        {title} {items.length > 0 && <span className="text-neutral-400">({items.length})</span>}
      </h2>
      <SiloGroupedList followUps={items} mode={mode} collapsed={collapsed} onToggleSection={onToggleSection} />
      {defaultDate !== undefined && (
        <div className="mt-3">
          <AddFollowUpForm areas={areas} defaultDate={defaultDate} />
        </div>
      )}
    </section>
  );
}

export default function WeekView({
  followUps,
  days,
  areas,
}: {
  followUps: FollowUpVM[];
  days: string[];
  areas: AreaOption[];
}) {
  const { mode, setMode, collapsed, toggleSection, expandAll, collapseAll } = useSiloViewState("week");

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const overdue = followUps.filter((f) => f.scheduledFor && f.scheduledFor < firstDay);
  const later = followUps.filter((f) => f.scheduledFor && f.scheduledFor > lastDay);
  const unscheduled = followUps.filter((f) => !f.scheduledFor);

  return (
    <div>
      <ViewModeToggle
        mode={mode}
        onModeChange={setMode}
        onExpandAll={expandAll}
        onCollapseAll={() => collapseAll(Array.from(new Set(followUps.map((f) => f.areaId))))}
      />

      {overdue.length > 0 && (
        <DaySection
          title="Overdue"
          items={overdue}
          areas={areas}
          tone="overdue"
          mode={mode}
          collapsed={collapsed}
          onToggleSection={toggleSection}
        />
      )}

      {days.map((day, i) => (
        <DaySection
          key={day}
          title={i === 0 ? `${formatDayLabel(parseDateOnly(day))} — Today` : formatDayLabel(parseDateOnly(day))}
          items={followUps.filter((f) => f.scheduledFor === day)}
          areas={areas}
          defaultDate={day}
          mode={mode}
          collapsed={collapsed}
          onToggleSection={toggleSection}
        />
      ))}

      {later.length > 0 && (
        <DaySection
          title="Later"
          items={later}
          areas={areas}
          tone="muted"
          mode={mode}
          collapsed={collapsed}
          onToggleSection={toggleSection}
        />
      )}

      <DaySection
        title="Unscheduled"
        items={unscheduled}
        areas={areas}
        tone="muted"
        defaultDate={null}
        mode={mode}
        collapsed={collapsed}
        onToggleSection={toggleSection}
      />
    </div>
  );
}
