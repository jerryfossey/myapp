import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  areaId: z.string().min(1),
  person: z.string().min(1),
  owes: z.string().min(1),
  cadence: z.string().min(1),
});

// Owner-authored ad-hoc reports (the "+" button), as opposed to the bulk
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

  const report = await prisma.report.create({
    data: {
      id: randomUUID(),
      areaId: parsed.data.areaId,
      person: parsed.data.person,
      owes: parsed.data.owes,
      cadence: parsed.data.cadence,
      status: "due",
    },
  });

  return NextResponse.json({ ok: true, report });
}
