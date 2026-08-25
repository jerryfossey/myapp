import { FollowUpVM } from "@/lib/types";
import { formatDayLabel } from "@/lib/format";
import { parseDateOnly } from "@/lib/dates";
import FollowUpRow from "./FollowUpRow";
import AddFollowUpForm from "./AddFollowUpForm";

type AreaOption = { id: string; name: string };

function sortBySiloThenPriority(items: FollowUpVM[]): FollowUpVM[] {
  return [...items].sort((a, b) => {
    if (a.areaName !== b.areaName) return a.areaName.localeCompare(b.areaName);
    const ap = a.priority ?? Infinity;
    const bp = b.priority ?? Infinity;
    if (ap !== bp) return ap - bp;
    return b.ageDays - a.ageDays;
  });
}

function DaySection({
  title,
  items,
  areas,
  defaultDate,
  tone,
}: {
  title: string;
  items: FollowUpVM[];
  areas: AreaOption[];
  defaultDate?: string | null;
  tone?: "overdue" | "muted";
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
      <div className="space-y-3">
        {sortBySiloThenPriority(items).map((f) => (
          <FollowUpRow key={f.id} followUp={f} showArea />
        ))}
        {defaultDate !== undefined && <AddFollowUpForm areas={areas} defaultDate={defaultDate} />}
      </div>
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
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const overdue = followUps.filter((f) => f.scheduledFor && f.scheduledFor < firstDay);
  const later = followUps.filter((f) => f.scheduledFor && f.scheduledFor > lastDay);
  const unscheduled = followUps.filter((f) => !f.scheduledFor);

  return (
    <div>
      {overdue.length > 0 && <DaySection title="Overdue" items={overdue} areas={areas} tone="overdue" />}

      {days.map((day, i) => (
        <DaySection
          key={day}
          title={i === 0 ? `${formatDayLabel(parseDateOnly(day))} — Today` : formatDayLabel(parseDateOnly(day))}
          items={followUps.filter((f) => f.scheduledFor === day)}
          areas={areas}
          defaultDate={day}
        />
      ))}

      {later.length > 0 && <DaySection title="Later" items={later} areas={areas} tone="muted" />}

      <DaySection title="Unscheduled" items={unscheduled} areas={areas} tone="muted" defaultDate={null} />
    </div>
  );
}
