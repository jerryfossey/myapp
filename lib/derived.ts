import { daysBetween } from "./dates";

export type ReportStatus = "in" | "due" | "overdue" | "done";
export type FollowUpStatus = "open" | "done" | "delegated";

const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
};

// Grace period added on top of the cadence window before something is
// considered overdue purely from elapsed time.
const OVERDUE_GRACE_DAYS = 2;

/**
 * Report status as stored is owner-controlled (via "mark received" / "flag").
 * When we have a lastReceivedAt and a known cadence, derive "overdue" purely
 * from elapsed time so a report doesn't silently stay "in" forever. Falls
 * back to the stored status otherwise, per the brief: "Overdue is derived
 * from cadence + last received where possible, otherwise set on import."
 */
export function derivedReportStatus(
  report: { status: string; cadence: string; lastReceivedAt: Date | null },
  today: Date
): ReportStatus {
  if (report.status === "done") return "done";
  if (report.lastReceivedAt) {
    const cadenceDays = CADENCE_DAYS[report.cadence.toLowerCase()] ?? null;
    if (cadenceDays) {
      const elapsed = daysBetween(report.lastReceivedAt, today);
      if (elapsed > cadenceDays + OVERDUE_GRACE_DAYS) return "overdue";
      return "in";
    }
  }
  return (report.status as ReportStatus) ?? "due";
}

export function followUpAgeDays(lastTouched: Date, today: Date): number {
  return daysBetween(lastTouched, today);
}

export const STALE_THRESHOLD_DAYS = 14;

export function isStale(ageDays: number): boolean {
  return ageDays >= STALE_THRESHOLD_DAYS;
}
