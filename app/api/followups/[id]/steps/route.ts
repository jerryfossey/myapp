import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ text: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const followUp = await prisma.followUp.findUnique({ where: { id: params.id } });
  if (!followUp) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const last = await prisma.step.findFirst({ where: { followUpId: params.id }, orderBy: { order: "desc" } });
  const step = await prisma.step.create({
    data: { followUpId: params.id, text: parsed.data.text, order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json({ ok: true, step });
}
