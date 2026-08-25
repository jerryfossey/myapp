import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/dates";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "expected YYYY-MM-DD");

const createSchema = z.object({
  areaId: z.string().min(1),
  name: z.string().min(1),
  dueDate: dateString.nullable().optional(),
});

// Owner-authored project grouping (app UI only) — not part of the import
// payload, same as ad-hoc follow-ups/reports.
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

  const project = await prisma.project.create({
    data: {
      areaId: parsed.data.areaId,
      name: parsed.data.name,
      dueDate: parsed.data.dueDate ? parseDateOnly(parsed.data.dueDate) : null,
    },
  });

  return NextResponse.json({ ok: true, project });
}
