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

export function daysBetween(from: Date, to: Date): number {
  const a = parseDateOnly(from).getTime();
  const b = parseDateOnly(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function formatAge(days: number): string {
  if (days < 0) return "0d";
  return `${days}d`;
}
