import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { parseDateOnly } from "@/lib/dates";
import { nextAfterCompleteOccurrence, nextFixedOccurrence, RecurrenceUnit } from "@/lib/recurrence";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

const recurrenceInput = z
  .object({
    type: z.enum(["fixed", "afterComplete"]),
    interval: z.number().int().min(1),
    unit: z.enum(["days", "weeks", "months"]),
    start: dateString,
  })
  .nullable();

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("followed-up") }),
  z.object({ action: z.literal("done") }),
  z.object({ action: z.literal("delegate"), delegateTo: z.string().min(1) }),
  z.object({ action: z.literal("reprioritize"), priority: z.number().int().nullable() }),
  z.object({ action: z.literal("add-note"), text: z.string().min(1) }),
  z.object({ action: z.literal("reschedule"), scheduledFor: dateString.nullable() }),
  z.object({ action: z.literal("set-due-date"), dueDate: dateString.nullable() }),
  z.object({ action: z.literal("set-recurrence"), recurrence: recurrenceInput }),
  z.object({
    action: z.literal("edit"),
    item: z.string().min(1),
    nextAction: z.string().min(1),
    waitingOn: z.string().min(1),
  }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.followUp.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const input = parsed.data;
  const today = await getReferenceToday();

  let followUp;
  switch (input.action) {
    case "followed-up":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { lastTouched: today },
      });
      break;
    case "done": {
      const ops = [
        prisma.followUp.update({
          where: { id: params.id },
          data: { status: "done" },
        }),
        prisma.statusEvent.create({
          data: { followUpId: existing.id, areaId: existing.areaId, from: existing.status, to: "done" },
        }),
      ];

      // Marking a recurring item done spawns its next occurrence as a new
      // open row carrying the same recurrence config forward. Guarded on
      // existing.status !== "done" so re-sending "done" on an
      // already-done item (a stale/duplicate request) can't spawn twice.
      if (existing.recurrenceType && existing.status !== "done") {
        const unit = existing.recurrenceUnit as RecurrenceUnit;
        const interval = existing.recurrenceInterval ?? 1;
        const nextDate =
          existing.recurrenceType === "fixed"
            ? nextFixedOccurrence(existing.recurrenceStart ?? today, interval, unit, today)
            : nextAfterCompleteOccurrence(today, interval, unit);

        ops.push(
          prisma.followUp.create({
            data: {
              id: randomUUID(),
              areaId: existing.areaId,
              projectId: existing.projectId,
              item: existing.item,
              waitingOn: existing.waitingOn,
              nextAction: existing.nextAction,
              status: "open",
              priority: existing.priority,
              lastTouched: today,
              scheduledFor: nextDate,
              recurrenceType: existing.recurrenceType,
              recurrenceInterval: existing.recurrenceInterval,
              recurrenceUnit: existing.recurrenceUnit,
              recurrenceStart: existing.recurrenceType === "fixed" ? existing.recurrenceStart : today,
            },
          })
        );
      }

      [followUp] = await prisma.$transaction(ops);
      break;
    }
    case "delegate":
      [followUp] = await prisma.$transaction([
        prisma.followUp.update({
          where: { id: params.id },
          data: { status: "delegated", waitingOn: input.delegateTo },
        }),
        prisma.statusEvent.create({
          data: { followUpId: existing.id, areaId: existing.areaId, from: existing.status, to: "delegated" },
        }),
      ]);
      break;
    case "reprioritize":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { priority: input.priority },
      });
      break;
    case "add-note":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { notes: { create: { text: input.text } } },
        include: { notes: { orderBy: { at: "desc" } } },
      });
      break;
    case "reschedule":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { scheduledFor: input.scheduledFor ? parseDateOnly(input.scheduledFor) : null },
      });
      break;
    case "set-due-date":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null },
      });
      break;
    case "set-recurrence":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: input.recurrence
          ? {
              recurrenceType: input.recurrence.type,
              recurrenceInterval: input.recurrence.interval,
              recurrenceUnit: input.recurrence.unit,
              recurrenceStart: parseDateOnly(input.recurrence.start),
            }
          : {
              recurrenceType: null,
              recurrenceInterval: null,
              recurrenceUnit: null,
              recurrenceStart: null,
            },
      });
      break;
    case "edit":
      // Fixes text on an already-created item, regardless of whether it
      // originated from the app or an import. For an imported item, a later
      // import that touches this same id will overwrite item/nextAction/
      // waitingOn again — they stay assistant-owned on update, per the
      // field-ownership rules; this only edits the current value.
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { item: input.item, nextAction: input.nextAction, waitingOn: input.waitingOn },
      });
      break;
  }

  return NextResponse.json({ ok: true, followUp });
}
