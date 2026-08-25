export type NoteVM = { id: string; at: string; text: string };

export type RecurrenceVM = {
  type: "fixed" | "afterComplete";
  interval: number;
  unit: "days" | "weeks" | "months";
  start: string; // ISO date
} | null;

export type FollowUpVM = {
  id: string;
  areaId: string;
  areaName: string;
  item: string;
  waitingOn: string;
  nextAction: string;
  status: "open" | "done" | "delegated";
  priority: number | null;
  lastTouched: string; // ISO date
  ageDays: number;
  stale: boolean;
  scheduledFor: string | null; // ISO date, null = unscheduled/backlog
  recurrence: RecurrenceVM;
  notes: NoteVM[];
};

export type ReportVM = {
  id: string;
  areaId: string;
  areaName: string;
  person: string;
  owes: string;
  cadence: string;
  displayStatus: "in" | "due" | "overdue" | "done";
};
