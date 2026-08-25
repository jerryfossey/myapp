import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { parseDateOnly } from "@/lib/dates";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

const createSchema = z.object({
  areaId: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
  item: z.string().min(1),
  waitingOn: z.string().min(1),
  nextAction: z.string().min(1),
  scheduledFor: dateString.nullable().optional(),
  dueDate: dateString.nullable().optional(),
  recurrence: z
    .object({
      type: z.enum(["fixed", "afterComplete"]),
      interval: z.number().int().min(1),
      unit: z.enum(["days", "weeks", "months"]),
      start: dateString,
    })
    .nullable()
    .optional(),
});

// Owner-authored ad-hoc follow-ups (the "+" button), as opposed to the bulk
// assistant-authored ones that arrive via POST /api/import.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const area = await prisma.area.findUnique({ where: { id: parsed.data.areaId } });
  if (!area) {
    return NextResponse.json({ error: "area not found" }, { status: 404 });
  }

  if (parsed.data.projectId) {
    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
    if (!project || project.areaId !== parsed.data.areaId) {
      return NextResponse.json({ error: "project not found in this area" }, { status: 404 });
    }
  }

  const today = await getReferenceToday();
  const followUp = await prisma.followUp.create({
    data: {
      id: randomUUID(),
      areaId: parsed.data.areaId,
      projectId: parsed.data.projectId ?? null,
      item: parsed.data.item,
      waitingOn: parsed.data.waitingOn,
      nextAction: parsed.data.nextAction,
      status: "open",
      priority: null,
      lastTouched: today,
      scheduledFor: parsed.data.scheduledFor ? parseDateOnly(parsed.data.scheduledFor) : null,
      dueDate: parsed.data.dueDate ? parseDateOnly(parsed.data.dueDate) : null,
      recurrenceType: parsed.data.recurrence?.type ?? null,
      recurrenceInterval: parsed.data.recurrence?.interval ?? null,
      recurrenceUnit: parsed.data.recurrence?.unit ?? null,
      recurrenceStart: parsed.data.recurrence ? parseDateOnly(parsed.data.recurrence.start) : null,
    },
  });

  return NextResponse.json({ ok: true, followUp });
}
