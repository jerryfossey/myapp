import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/dates";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rename"), name: z.string().min(1) }),
  z.object({ action: z.literal("set-due-date"), dueDate: dateString.nullable() }),
  z.object({ action: z.literal("archive") }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const input = parsed.data;
  let project;
  if (input.action === "rename") {
    project = await prisma.project.update({ where: { id: params.id }, data: { name: input.name } });
  } else if (input.action === "set-due-date") {
    project = await prisma.project.update({
      where: { id: params.id },
      data: { dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null },
    });
  } else {
    project = await prisma.project.update({ where: { id: params.id }, data: { archived: true } });
  }

  return NextResponse.json({ ok: true, project });
}
