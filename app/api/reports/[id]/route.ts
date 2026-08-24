import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReferenceToday } from "@/lib/meta";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("received") }),
  z.object({ action: z.literal("flag"), status: z.enum(["due", "overdue"]) }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.report.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const input = parsed.data;
  let report;
  if (input.action === "received") {
    const today = await getReferenceToday();
    report = await prisma.report.update({
      where: { id: params.id },
      data: { status: "in", lastReceivedAt: today },
    });
  } else {
    report = await prisma.report.update({
      where: { id: params.id },
      data: { status: input.status },
    });
  }

  return NextResponse.json({ ok: true, report });
}
