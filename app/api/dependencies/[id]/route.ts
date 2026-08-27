import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.followUpDependency.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await prisma.followUpDependency.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
