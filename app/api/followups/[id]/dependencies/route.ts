import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ dependsOnId: z.string().min(1) });

// Dependencies are informational only (a "blocked by" badge, nothing is
// gated) but are still kept acyclic and scoped to one project — a
// dependency across projects, or between a subtask and something outside
// any project, wouldn't mean anything actionable.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { dependsOnId } = parsed.data;

  if (dependsOnId === params.id) {
    return NextResponse.json({ error: "a subtask can't depend on itself" }, { status: 400 });
  }

  const [followUp, dependsOn] = await Promise.all([
    prisma.followUp.findUnique({ where: { id: params.id } }),
    prisma.followUp.findUnique({ where: { id: dependsOnId } }),
  ]);
  if (!followUp || !dependsOn) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!followUp.projectId || followUp.projectId !== dependsOn.projectId) {
    return NextResponse.json({ error: "both subtasks must be in the same project" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: followUp.projectId },
    include: { followUps: { select: { id: true } } },
  });
  const subtaskIds = project!.followUps.map((f) => f.id);
  const edges = await prisma.followUpDependency.findMany({ where: { followUpId: { in: subtaskIds } } });

  const dependsOnMap = new Map<string, string[]>();
  for (const e of edges) {
    if (!dependsOnMap.has(e.followUpId)) dependsOnMap.set(e.followUpId, []);
    dependsOnMap.get(e.followUpId)!.push(e.dependsOnId);
  }

  // Would adding "followUp depends on dependsOn" close a loop? True iff
  // dependsOn already (transitively) depends on followUp.
  const visited = new Set<string>();
  const queue = [...(dependsOnMap.get(dependsOnId) ?? [])];
  let cycle = false;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === params.id) {
      cycle = true;
      break;
    }
    if (visited.has(cur)) continue;
    visited.add(cur);
    queue.push(...(dependsOnMap.get(cur) ?? []));
  }
  if (cycle) {
    return NextResponse.json({ error: "that would create a dependency cycle" }, { status: 400 });
  }

  const dependency = await prisma.followUpDependency.upsert({
    where: { followUpId_dependsOnId: { followUpId: params.id, dependsOnId } },
    create: { followUpId: params.id, dependsOnId },
    update: {},
  });

  return NextResponse.json({ ok: true, dependency });
}
