import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { derivedReportStatus } from "@/lib/derived";
import { toFollowUpVM, toProjectVM, sortFollowUps, followUpVMInclude } from "@/lib/queries";
import { ReportVM } from "@/lib/types";
import { formatDate } from "@/lib/format";
import FollowUpRow from "@/components/FollowUpRow";
import ReportRow from "@/components/ReportRow";
import ProjectCard from "@/components/ProjectCard";
import AddFollowUpForm from "@/components/AddFollowUpForm";
import AddReportForm from "@/components/AddReportForm";
import AddProjectForm from "@/components/AddProjectForm";

export const dynamic = "force-dynamic";

export default async function AreaDetailPage({ params }: { params: { id: string } }) {
  const [area, projectRows, today] = await Promise.all([
    prisma.area.findUnique({
      where: { id: params.id },
      include: {
        reports: true,
        followUps: { include: { ...followUpVMInclude, notes: { orderBy: { at: "desc" } } } },
      },
    }),
    prisma.project.findMany({
      where: { areaId: params.id },
      orderBy: { createdAt: "asc" },
      include: { area: true, followUps: { include: { ...followUpVMInclude, notes: { orderBy: { at: "desc" } } } } },
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

  // Follow-ups that belong to a project render under that project's card
  // instead of the general list, so nothing appears twice.
  const followUps = area.followUps.filter((f) => !f.projectId).map((f) => toFollowUpVM(f, today));

  const active = sortFollowUps(followUps.filter((f) => f.status !== "done"));
  const done = followUps.filter((f) => f.status === "done");

  const activeReports = reports.filter((r) => r.displayStatus !== "done");
  const doneReports = reports.filter((r) => r.displayStatus === "done");

  const projects = projectRows.map((p) => toProjectVM(p, today));
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);

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
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">Projects</h2>
        {activeProjects.length === 0 && <p className="mb-3 text-sm text-neutral-500">No active projects.</p>}
        <div className="space-y-3">
          {activeProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          <AddProjectForm areaId={area.id} />
        </div>
      </section>

      {archivedProjects.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            Archived projects ({archivedProjects.length})
          </summary>
          <div className="mt-3 space-y-2">
            {archivedProjects.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-2 text-sm">
                <span>{p.name}</span>
                <span className="viz-tabular text-xs text-neutral-500">
                  {p.doneCount}/{p.openCount + p.doneCount + p.delegatedCount} done
                  {p.dueDate && ` · due ${formatDate(new Date(p.dueDate))}`}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

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
