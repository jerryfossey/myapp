import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";
import { parseDateOnly } from "@/lib/dates";

const createSchema = z.object({
  areaId: z.string().min(1),
  item: z.string().min(1),
  waitingOn: z.string().min(1),
  nextAction: z.string().min(1),
  scheduledFor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD")
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

  const today = await getReferenceToday();
  const followUp = await prisma.followUp.create({
    data: {
      id: randomUUID(),
      areaId: parsed.data.areaId,
      item: parsed.data.item,
      waitingOn: parsed.data.waitingOn,
      nextAction: parsed.data.nextAction,
      status: "open",
      priority: null,
      lastTouched: today,
      scheduledFor: parsed.data.scheduledFor ? parseDateOnly(parsed.data.scheduledFor) : null,
    },
  });

  return NextResponse.json({ ok: true, followUp });
}
