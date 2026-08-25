import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { derivedReportStatus, followUpAgeDays, isStale } from "@/lib/derived";
import { dateOnlyISO } from "@/lib/dates";
import { FollowUpVM, ReportVM } from "@/lib/types";
import FollowUpRow from "@/components/FollowUpRow";
import ReportRow from "@/components/ReportRow";
import AddFollowUpForm from "@/components/AddFollowUpForm";

export const dynamic = "force-dynamic";

export default async function AreaDetailPage({ params }: { params: { id: string } }) {
  const [area, today] = await Promise.all([
    prisma.area.findUnique({
      where: { id: params.id },
      include: { reports: true, followUps: { include: { notes: { orderBy: { at: "desc" } } } } },
    }),
    getReferenceToday(),
  ]);

  if (!area) notFound();

  const reports: ReportVM[] = area.reports.map((r) => ({
    id: r.id,
    areaId: area.id,
    areaName: area.name,
    person: r.person,
    owes: r.owes,
    cadence: r.cadence,
    displayStatus: derivedReportStatus(r, today),
  }));

  const followUps: FollowUpVM[] = area.followUps.map((f) => {
    const ageDays = followUpAgeDays(f.lastTouched, today);
    return {
      id: f.id,
      areaId: area.id,
      areaName: area.name,
      item: f.item,
      waitingOn: f.waitingOn,
      nextAction: f.nextAction,
      status: f.status as FollowUpVM["status"],
      priority: f.priority,
      lastTouched: dateOnlyISO(f.lastTouched),
      ageDays,
      stale: isStale(ageDays),
      notes: f.notes.map((n) => ({ id: n.id, at: n.at.toISOString(), text: n.text })),
    };
  });

  const active = followUps
    .filter((f) => f.status !== "done")
    .sort((a, b) => {
      const ap = a.priority ?? Infinity;
      const bp = b.priority ?? Infinity;
      if (ap !== bp) return ap - bp;
      return b.ageDays - a.ageDays;
    });
  const done = followUps.filter((f) => f.status === "done");

  return (
    <div>
      <Link href="/" className="mb-3 inline-block text-sm text-neutral-500">
        ← Home
      </Link>

      <h1 className="text-xl font-bold">{area.name}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{area.state}</p>

      <div className="mt-3 flex items-baseline justify-between rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-900">
        <span className="text-neutral-500">{area.metricLabel}</span>
        <span className="font-semibold tabular-nums">{area.metricValue}</span>
      </div>

      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        Constraint: {area.constraint}
      </p>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">Lever:</span> {area.lever}
      </p>

      {reports.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">Reports</h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <ReportRow key={r.id} report={r} showArea={false} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">Follow-ups</h2>
        {active.length === 0 && <p className="mb-3 text-sm text-neutral-500">Nothing open.</p>}
        <div className="space-y-3">
          {active.map((f) => (
            <FollowUpRow key={f.id} followUp={f} showArea={false} />
          ))}
          <AddFollowUpForm areaId={area.id} />
        </div>
      </section>

      {done.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            Archived / done ({done.length})
          </summary>
          <div className="mt-3 space-y-3">
            {done.map((f) => (
              <FollowUpRow key={f.id} followUp={f} showArea={false} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
