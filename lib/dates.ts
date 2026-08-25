// All dates in this app are treated as calendar dates (no time-of-day component).
// The "reference today" used for age/overdue math is the assistant-supplied
// meta.today (updated on each import), not the device clock — this keeps the
// board's math reproducible and independent of client/server clock skew, per
// the brief's data model comment on meta.today.

export function dateOnlyISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDateOnly(s: string | Date): Date {
  if (s instanceof Date) return new Date(dateOnlyISO(s) + "T00:00:00.000Z");
  return new Date(s.slice(0, 10) + "T00:00:00.000Z");
}

export function addDays(d: Date, days: number): Date {
  const base = parseDateOnly(d);
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

export function daysBetween(from: Date, to: Date): number {
  const a = parseDateOnly(from).getTime();
  const b = parseDateOnly(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function formatAge(days: number): string {
  if (days < 0) return "0d";
  return `${days}d`;
}

const ISO_WEEK_RE = /^\d{4}-W\d{2}$/;

export function isIsoWeek(s: string): boolean {
  return ISO_WEEK_RE.test(s);
}

// ISO 8601 week: weeks start Monday; week 1 is the week containing the
// year's first Thursday.
export function isoWeekOf(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1 .. Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function currentIsoWeek(): string {
  return isoWeekOf(new Date());
}

// Monday of the given ISO week, as a date-only Date.
export function isoWeekStart(week: string): Date {
  const [yearStr, weekStr] = week.split("-W");
  const year = Number(yearStr);
  const weekNum = Number(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayNum = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum + 1);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (weekNum - 1) * 7);
  return start;
}

export function isoWeekLabel(week: string): string {
  const start = isoWeekStart(week);
  const end = addDays(start, 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)}–${fmt(end)}`;
}

// Previous/next ISO week string, crossing year boundaries correctly.
export function shiftIsoWeek(week: string, delta: number): string {
  const start = isoWeekStart(week);
  start.setUTCDate(start.getUTCDate() + delta * 7);
  return isoWeekOf(start);
}
