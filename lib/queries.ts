import { prisma } from "./prisma";
import { getReferenceToday } from "./meta";
import { derivedReportStatus, followUpAgeDays, isStale } from "./derived";
import { dateOnlyISO } from "./dates";
import { FollowUpVM, ReportVM } from "./types";

export async function getAllFollowUps(): Promise<{ followUps: FollowUpVM[]; today: Date }> {
  const today = await getReferenceToday();
  const rows = await prisma.followUp.findMany({
    include: { area: true, notes: { orderBy: { at: "desc" } } },
  });

  const followUps: FollowUpVM[] = rows.map((f) => {
    const ageDays = followUpAgeDays(f.lastTouched, today);
    return {
      id: f.id,
      areaId: f.areaId,
      areaName: f.area.name,
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

  return { followUps, today };
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
