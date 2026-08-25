import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { derivedReportStatus } from "@/lib/derived";
import { toFollowUpVM, sortFollowUps } from "@/lib/queries";
import { ReportVM } from "@/lib/types";
import FollowUpRow from "@/components/FollowUpRow";
import ReportRow from "@/components/ReportRow";
import AddFollowUpForm from "@/components/AddFollowUpForm";
import AddReportForm from "@/components/AddReportForm";

export const dynamic = "force-dynamic";

export default async function AreaDetailPage({ params }: { params: { id: string } }) {
  const [area, today] = await Promise.all([
    prisma.area.findUnique({
      where: { id: params.id },
      include: {
        reports: true,
        followUps: { include: { area: true, notes: { orderBy: { at: "desc" } } } },
      },
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

  const followUps = area.followUps.map((f) => toFollowUpVM(f, today));

  const active = sortFollowUps(followUps.filter((f) => f.status !== "done"));
  const done = followUps.filter((f) => f.status === "done");

  const activeReports = reports.filter((r) => r.displayStatus !== "done");
  const doneReports = reports.filter((r) => r.displayStatus === "done");

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

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">Reports</h2>
        {activeReports.length === 0 && <p className="mb-3 text-sm text-neutral-500">Nothing open.</p>}
        <div className="space-y-2">
          {activeReports.map((r) => (
            <ReportRow key={r.id} report={r} showArea={false} />
          ))}
          <AddReportForm areaId={area.id} />
        </div>
      </section>

      {doneReports.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            Archived reports ({doneReports.length})
          </summary>
          <div className="mt-3 space-y-2">
            {doneReports.map((r) => (
              <ReportRow key={r.id} report={r} showArea={false} />
            ))}
          </div>
        </details>
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
