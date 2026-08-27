import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getReferenceToday } from "./meta";
import { derivedReportStatus, followUpAgeDays, isProjectAtRisk, isStale } from "./derived";
import { daysBetween, dateOnlyISO, parseDateOnly } from "./dates";
import { FollowUpVM, ProjectVM, ReportVM } from "./types";

export const followUpVMInclude = {
  area: true,
  notes: true,
  steps: true,
  blockedBy: { include: { dependsOn: true } },
} satisfies Prisma.FollowUpInclude;

type FollowUpWithArea = Prisma.FollowUpGetPayload<{ include: typeof followUpVMInclude }>;

export function toFollowUpVM(f: FollowUpWithArea, today: Date): FollowUpVM {
  const ageDays = followUpAgeDays(f.lastTouched, today);
  return {
    id: f.id,
    areaId: f.areaId,
    areaName: f.area.name,
    projectId: f.projectId,
    item: f.item,
    waitingOn: f.waitingOn,
    nextAction: f.nextAction,
    status: f.status as FollowUpVM["status"],
    priority: f.priority,
    lastTouched: dateOnlyISO(f.lastTouched),
    ageDays,
    stale: isStale(ageDays),
    scheduledFor: f.scheduledFor ? dateOnlyISO(f.scheduledFor) : null,
    dueDate: f.dueDate ? dateOnlyISO(f.dueDate) : null,
    dueOverdue: f.status !== "done" && f.dueDate !== null && daysBetween(today, f.dueDate) < 0,
    recurrence:
      f.recurrenceType && f.recurrenceInterval && f.recurrenceUnit && f.recurrenceStart
        ? {
            type: f.recurrenceType as "fixed" | "afterComplete",
            interval: f.recurrenceInterval,
            unit: f.recurrenceUnit as "days" | "weeks" | "months",
            start: dateOnlyISO(f.recurrenceStart),
          }
        : null,
    notes: f.notes.map((n) => ({ id: n.id, at: n.at.toISOString(), text: n.text })),
    steps: f.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: s.id, text: s.text, done: s.done, order: s.order })),
    blockedBy: f.blockedBy.map((d) => ({
      id: d.id,
      dependsOnId: d.dependsOnId,
      item: d.dependsOn.item,
      done: d.dependsOn.status === "done",
    })),
  };
}

type ProjectWithSubtasks = Prisma.ProjectGetPayload<{
  include: { area: true; followUps: { include: typeof followUpVMInclude } };
}>;

export function toProjectVM(p: ProjectWithSubtasks, today: Date): ProjectVM {
  const subtasks = p.followUps.map((f) => toFollowUpVM(f, today));
  const openCount = subtasks.filter((s) => s.status === "open").length;
  const doneCount = subtasks.filter((s) => s.status === "done").length;
  const delegatedCount = subtasks.filter((s) => s.status === "delegated").length;

  return {
    id: p.id,
    areaId: p.areaId,
    areaName: p.area.name,
    name: p.name,
    dueDate: p.dueDate ? dateOnlyISO(p.dueDate) : null,
    atRisk: isProjectAtRisk(p.dueDate ? parseDateOnly(p.dueDate) : null, today, openCount + delegatedCount > 0),
    archived: p.archived,
    openCount,
    doneCount,
    delegatedCount,
    subtasks,
  };
}

export async function getAllFollowUps(): Promise<{ followUps: FollowUpVM[]; today: Date }> {
  const today = await getReferenceToday();
  const rows = await prisma.followUp.findMany({
    include: { ...followUpVMInclude, notes: { orderBy: { at: "desc" } } },
  });

  return { followUps: rows.map((f) => toFollowUpVM(f, today)), today };
}

export function sortFollowUps(followUps: FollowUpVM[]): FollowUpVM[] {
  return [...followUps].sort((a, b) => {
    const ap = a.priority ?? Infinity;
    const bp = b.priority ?? Infinity;
    if (ap !== bp) return ap - bp;
    return b.ageDays - a.ageDays; // oldest lastTouched (largest age) first
  });
}

export async function getAllReports(): Promise<{ reports: ReportVM[]; today: Date }> {
  const today = await getReferenceToday();
  const rows = await prisma.report.findMany({ include: { area: true } });

  const reports: ReportVM[] = rows.map((r) => ({
    id: r.id,
    areaId: r.areaId,
    areaName: r.area.name,
    person: r.person,
    owes: r.owes,
    cadence: r.cadence,
    displayStatus: derivedReportStatus(r, today),
  }));

  return { reports, today };
}
