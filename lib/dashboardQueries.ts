import { prisma } from "./prisma";
import { getReferenceToday } from "./meta";
import { daysBetween, currentIsoWeek, isoWeekOf } from "./dates";
import { STALE_THRESHOLD_DAYS } from "./derived";
import { TIME_CATEGORIES, getTimeCategory } from "./timeCategories";
import { CORE_SILO_CHART_ORDER } from "./areaColors";

// ---------------------------------------------------------------------------
// Section 1: Silo Health — computed live from existing follow-up/report data.
// ---------------------------------------------------------------------------

export type SiloHealth = {
  areaId: string;
  areaName: string;
  openCount: number;
  doneCount: number;
  delegatedCount: number;
  oldestUntouchedAgeDays: number | null; // null = no open items
  overdueReportCount: number;
  stalling: boolean;
};

export async function getSiloHealth(): Promise<SiloHealth[]> {
  const today = await getReferenceToday();
  const areas = await prisma.area.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      followUps: { where: { archived: false } },
      reports: { where: { archived: false } },
    },
  });

  return areas.map((area) => {
    let openCount = 0;
    let doneCount = 0;
    let delegatedCount = 0;
    let oldestAge: number | null = null;

    for (const fu of area.followUps) {
      if (fu.status === "open") {
        openCount++;
        const age = daysBetween(fu.lastTouched, today);
        if (oldestAge === null || age > oldestAge) oldestAge = age;
      } else if (fu.status === "done") {
        doneCount++;
      } else if (fu.status === "delegated") {
        delegatedCount++;
      }
    }

    const overdueReportCount = area.reports.filter((r) => r.status === "overdue").length;

    return {
      areaId: area.id,
      areaName: area.name,
      openCount,
      doneCount,
      delegatedCount,
      oldestUntouchedAgeDays: oldestAge,
      overdueReportCount,
      stalling: oldestAge !== null && oldestAge >= STALE_THRESHOLD_DAYS,
    };
  });
}

// ---------------------------------------------------------------------------
// Section 2: Trends — from status_events and bhag snapshots.
// ---------------------------------------------------------------------------

export type BhagSnapshotPoint = {
  at: string; // ISO timestamp
  asOf: string; // ISO date
  cashOnHand: number;
  helocBalance: number;
  cashTarget: number;
};

export type CompletionWeekPoint = {
  week: string; // ISO week
  bySilo: Record<string, number>; // areaId (or "other") -> count
};

export async function getBhagTrend(): Promise<BhagSnapshotPoint[]> {
  const rows = await prisma.snapshot.findMany({
    where: { kind: "bhag" },
    orderBy: { at: "asc" },
  });
  return rows.map((r) => ({
    at: r.at.toISOString(),
    asOf: r.asOf.toISOString().slice(0, 10),
    cashOnHand: r.cashOnHand,
    helocBalance: r.helocBalance,
    cashTarget: r.cashTarget,
  }));
}

export async function getCompletionsTrend(): Promise<{ weeks: CompletionWeekPoint[]; seriesOrder: string[] }> {
  const rows = await prisma.statusEvent.findMany({
    where: { to: "done" },
    orderBy: { at: "asc" },
  });

  const coreSet = new Set<string>(CORE_SILO_CHART_ORDER);
  const byWeek = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const week = isoWeekOf(row.at);
    const bucket = coreSet.has(row.areaId) ? row.areaId : "other";
    if (!byWeek.has(week)) byWeek.set(week, {});
    const rec = byWeek.get(week)!;
    rec[bucket] = (rec[bucket] ?? 0) + 1;
  }

  const weeks = [...byWeek.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([week, bySilo]) => ({ week, bySilo }));

  return { weeks, seriesOrder: [...CORE_SILO_CHART_ORDER, "other"] };
}

// ---------------------------------------------------------------------------
// Section 3: Time — plan vs actual per category, for a given ISO week.
// ---------------------------------------------------------------------------

export type TimeCategoryPoint = {
  categoryId: string;
  label: string;
  accent: string;
  planned: number;
  actual: number | null; // null = no data yet this week (a gap, not zero)
  variance: number | null; // actual - planned; null when actual is null
};

export type TimeSection = {
  week: string;
  categories: TimeCategoryPoint[];
  daysUploaded: number; // capped display at 7
};

// Lazily seeds any category rows missing for this week (planned from the
// seed table, actual left null) without touching rows that already exist —
// so an owner edit to `planned` is never clobbered by a later view.
async function ensureTimeWeekSeeded(week: string): Promise<void> {
  const existing = await prisma.timeWeek.findMany({ where: { week }, select: { categoryId: true } });
  const existingIds = new Set(existing.map((r) => r.categoryId));
  const missing = TIME_CATEGORIES.filter((c) => !existingIds.has(c.id));
  if (missing.length === 0) return;
  await prisma.timeWeek.createMany({
    data: missing.map((c) => ({ week, categoryId: c.id, planned: c.planned, actual: null })),
    skipDuplicates: true,
  });
}

export async function getTimeSection(week?: string): Promise<TimeSection> {
  const targetWeek = week ?? currentIsoWeek();
  await ensureTimeWeekSeeded(targetWeek);

  const [rows, uploadCount] = await Promise.all([
    prisma.timeWeek.findMany({ where: { week: targetWeek } }),
    prisma.timeUploadLog.count({ where: { week: targetWeek } }),
  ]);

  const categories: TimeCategoryPoint[] = rows
    .map((r) => {
      const cat = getTimeCategory(r.categoryId);
      return {
        categoryId: r.categoryId,
        label: cat?.label ?? r.categoryId,
        accent: cat?.accent ?? "neutral",
        planned: r.planned,
        actual: r.actual,
        variance: r.actual === null ? null : r.actual - r.planned,
      };
    })
    .sort((a, b) => TIME_CATEGORIES.findIndex((c) => c.id === a.categoryId) - TIME_CATEGORIES.findIndex((c) => c.id === b.categoryId));

  return { week: targetWeek, categories, daysUploaded: Math.min(uploadCount, 7) };
}

export async function getAvailableWeeks(): Promise<string[]> {
  const rows = await prisma.timeWeek.findMany({ select: { week: true }, distinct: ["week"] });
  const weeks = new Set(rows.map((r) => r.week));
  weeks.add(currentIsoWeek());
  return [...weeks].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)); // newest first
}
