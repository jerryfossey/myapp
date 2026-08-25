import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { parseDateOnly } from "@/lib/dates";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("followed-up") }),
  z.object({ action: z.literal("done") }),
  z.object({ action: z.literal("delegate"), delegateTo: z.string().min(1) }),
  z.object({ action: z.literal("reprioritize"), priority: z.number().int().nullable() }),
  z.object({ action: z.literal("add-note"), text: z.string().min(1) }),
  z.object({ action: z.literal("reschedule"), scheduledFor: dateString.nullable() }),
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
    case "done":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { status: "done" },
      });
      break;
    case "delegate":
      followUp = await prisma.followUp.update({
        where: { id: params.id },
        data: { status: "delegated", waitingOn: input.delegateTo },
      });
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
  }

  return NextResponse.json({ ok: true, followUp });
}
