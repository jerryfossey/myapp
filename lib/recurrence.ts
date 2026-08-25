import { parseDateOnly } from "./dates";
import { formatDate } from "./format";

export type RecurrenceUnit = "days" | "weeks" | "months";
export type RecurrenceType = "fixed" | "afterComplete";

export type RecurrenceRule = {
  type: RecurrenceType;
  interval: number;
  unit: RecurrenceUnit;
  start: string; // ISO date
};

function stepDate(d: Date, interval: number, unit: RecurrenceUnit): Date {
  const next = new Date(d);
  if (unit === "days") next.setUTCDate(next.getUTCDate() + interval);
  else if (unit === "weeks") next.setUTCDate(next.getUTCDate() + interval * 7);
  else next.setUTCMonth(next.getUTCMonth() + interval);
  return next;
}

// The next occurrence strictly after `after`, stepping forward from the
// fixed anchor date by whole periods — so a monthly recurrence anchored on
// the 1st always lands on the 1st, however many periods were skipped while
// the item sat undone.
export function nextFixedOccurrence(anchor: Date, interval: number, unit: RecurrenceUnit, after: Date): Date {
  const safeInterval = Math.max(1, interval);
  let d = parseDateOnly(anchor);
  const cutoff = parseDateOnly(after).getTime();
  while (d.getTime() <= cutoff) {
    d = stepDate(d, safeInterval, unit);
  }
  return d;
}

// completedOn + interval/unit — recurrence relative to when it was
// actually finished, not a fixed calendar slot.
export function nextAfterCompleteOccurrence(completedOn: Date, interval: number, unit: RecurrenceUnit): Date {
  return stepDate(parseDateOnly(completedOn), Math.max(1, interval), unit);
}

const UNIT_LABEL: Record<RecurrenceUnit, [string, string]> = {
  days: ["day", "days"],
  weeks: ["week", "weeks"],
  months: ["month", "months"],
};

function unitLabel(interval: number, unit: RecurrenceUnit): string {
  const [singular, plural] = UNIT_LABEL[unit];
  return interval === 1 ? singular : plural;
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const every = rule.interval === 1 ? "" : `${rule.interval} `;
  if (rule.type === "afterComplete") {
    return `Repeats ${every}${unitLabel(rule.interval, rule.unit)} after done`;
  }
  const cadence = rule.interval === 1 ? `every ${unitLabel(1, rule.unit)}` : `every ${every}${unitLabel(rule.interval, rule.unit)}`;
  return `Repeats ${cadence}, from ${formatDate(parseDateOnly(rule.start))}`;
}
