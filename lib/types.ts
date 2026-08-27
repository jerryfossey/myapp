export type NoteVM = { id: string; at: string; text: string };

export type RecurrenceVM = {
  type: "fixed" | "afterComplete";
  interval: number;
  unit: "days" | "weeks" | "months";
  start: string; // ISO date
} | null;

export type StepVM = { id: string; text: string; done: boolean; order: number };

export type DependencyVM = { id: string; dependsOnId: string; item: string; done: boolean };

export type FollowUpVM = {
  id: string;
  areaId: string;
  areaName: string;
  projectId: string | null;
  item: string;
  waitingOn: string;
  nextAction: string;
  status: "open" | "done" | "delegated";
  priority: number | null;
  lastTouched: string; // ISO date
  ageDays: number;
  stale: boolean;
  scheduledFor: string | null; // ISO date, null = unscheduled/backlog
  dueDate: string | null; // ISO date, a deadline independent of scheduledFor
  dueOverdue: boolean; // dueDate has passed and it's still open
  recurrence: RecurrenceVM;
  notes: NoteVM[];
  steps: StepVM[];
  blockedBy: DependencyVM[]; // subtasks this one depends on, informational only
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

export type ProjectVM = {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  dueDate: string | null; // ISO date
  atRisk: boolean;
  archived: boolean;
  openCount: number;
  doneCount: number;
  delegatedCount: number;
  subtasks: FollowUpVM[];
};
