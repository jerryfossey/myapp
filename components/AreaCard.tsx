import Link from "next/link";

export default function AreaCard({
  area,
}: {
  area: {
    id: string;
    name: string;
    state: string;
    metricLabel: string;
    metricValue: string;
    constraint: string;
    openFollowUps: number;
    overdueReports: number;
  };
}) {
  return (
    <Link href={`/area/${area.id}`} className="card block active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{area.name}</h3>
        <div className="flex shrink-0 gap-1.5">
          {area.overdueReports > 0 && (
            <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              {area.overdueReports} overdue
            </span>
          )}
          {area.openFollowUps > 0 && (
            <span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {area.openFollowUps} open
            </span>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">{area.state}</p>

      <div className="mt-2 flex items-baseline justify-between text-sm">
        <span className="text-neutral-500">{area.metricLabel}</span>
        <span className="font-medium tabular-nums">{area.metricValue}</span>
      </div>

      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        {area.constraint}
      </p>
    </Link>
  );
}
