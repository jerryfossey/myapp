import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("toggle") }),
  z.object({ action: z.literal("rename"), text: z.string().min(1) }),
  z.object({ action: z.literal("move"), direction: z.enum(["up", "down"]) }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.step.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const input = parsed.data;

  if (input.action === "toggle") {
    const step = await prisma.step.update({ where: { id: params.id }, data: { done: !existing.done } });
    return NextResponse.json({ ok: true, step });
  }

  if (input.action === "rename") {
    const step = await prisma.step.update({ where: { id: params.id }, data: { text: input.text } });
    return NextResponse.json({ ok: true, step });
  }

  // move
  const siblings = await prisma.step.findMany({
    where: { followUpId: existing.followUpId },
    orderBy: { order: "asc" },
  });
  const idx = siblings.findIndex((s) => s.id === existing.id);
  const swapIdx = input.direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) {
    return NextResponse.json({ ok: true, step: existing }); // already at the end — no-op
  }
  const other = siblings[swapIdx];
  const [step] = await prisma.$transaction([
    prisma.step.update({ where: { id: existing.id }, data: { order: other.order } }),
    prisma.step.update({ where: { id: other.id }, data: { order: existing.order } }),
  ]);

  return NextResponse.json({ ok: true, step });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.step.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await prisma.step.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
