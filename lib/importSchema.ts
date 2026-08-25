import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

export const noteSchema = z.object({
  at: z.string(),
  text: z.string(),
});

export const reportSchema = z.object({
  id: z.string().min(1),
  person: z.string().min(1),
  owes: z.string().min(1),
  cadence: z.string().min(1),
  status: z.enum(["in", "due", "overdue", "done"]).optional(),
});

export const followUpSchema = z.object({
  id: z.string().min(1),
  item: z.string().min(1),
  waitingOn: z.string().min(1),
  nextAction: z.string().min(1),
  status: z.enum(["open", "done", "delegated"]).optional(),
  priority: z.number().int().nullable().optional(),
  lastTouched: dateString.optional(),
  notes: z.array(noteSchema).optional(),
});

export const areaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  state: z.string().optional(),
  metric: z.object({ label: z.string(), value: z.string() }).optional(),
  constraint: z.string().optional(),
  lever: z.string().optional(),
  reports: z.array(reportSchema).optional(),
  followUps: z.array(followUpSchema).optional(),
});

export const bhagSchema = z.object({
  label: z.string().optional(),
  cashOnHand: z.number().optional(),
  cashTarget: z.number().optional(),
  helocBalance: z.number().optional(),
  asOf: dateString.optional(),
  note: z.string().nullable().optional(),
});

export const metaSchema = z.object({
  owner: z.string().optional(),
  today: dateString.optional(),
});

export const timeEntrySchema = z.object({
  categoryId: z.string().min(1),
  actual: z.number().nonnegative(),
});

export const timeBlockSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/, "expected ISO week, e.g. 2026-W35"),
  entries: z.array(timeEntrySchema),
});

export const importPayloadSchema = z.object({
  meta: metaSchema.optional(),
  bhag: bhagSchema.optional(),
  areas: z.array(areaSchema).optional(),
  time: timeBlockSchema.optional(),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
