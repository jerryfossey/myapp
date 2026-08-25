import { NextRequest, NextResponse } from "next/server";
import { checkImportSecret } from "@/lib/auth";
import { importPayloadSchema } from "@/lib/importSchema";
import { runImport } from "@/lib/importUpsert";
import { prisma } from "@/lib/prisma";
import { dateOnlyISO } from "@/lib/dates";

// Accepts the token via the standard Authorization header, or a ?token=
// query param — the latter exists so the export below can be fetched from
// contexts (like a plain browser tab, or a URL-only fetch tool) that can't
// set custom headers.
async function authorize(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("authorization");
  const tokenParam = req.nextUrl.searchParams.get("token");
  return checkImportSecret(header ?? (tokenParam ? `Bearer ${tokenParam}` : null));
}

export async function POST(req: NextRequest) {
  const authorized = await authorize(req);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const summary = await runImport(parsed.data);
  return NextResponse.json({ ok: true, summary });
}

// Exports the current board in the same shape POST accepts, so it can be
// fed straight back in (backup/restore, or seeding another environment).
export async function GET(req: NextRequest) {
  const authorized = await authorize(req);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [meta, bhag, areas] = await Promise.all([
    prisma.meta.findUnique({ where: { id: 1 } }),
    prisma.bhag.findUnique({ where: { id: 1 } }),
    prisma.area.findMany({
      where: { archived: false },
      orderBy: { createdAt: "asc" },
      include: {
        reports: { orderBy: { createdAt: "asc" } },
        followUps: { orderBy: { createdAt: "asc" }, include: { notes: { orderBy: { at: "asc" } } } },
      },
    }),
  ]);

  const payload = {
    meta: meta ? { owner: meta.owner, today: dateOnlyISO(meta.today) } : undefined,
    bhag: bhag
      ? {
          label: bhag.label,
          cashOnHand: bhag.cashOnHand,
          cashTarget: bhag.cashTarget,
          helocBalance: bhag.helocBalance,
          asOf: dateOnlyISO(bhag.asOf),
          note: bhag.note,
        }
      : undefined,
    areas: areas.map((a) => ({
      id: a.id,
      name: a.name,
      state: a.state,
      metric: { label: a.metricLabel, value: a.metricValue },
      constraint: a.constraint,
      lever: a.lever,
      reports: a.reports.map((r) => ({
        id: r.id,
        person: r.person,
        owes: r.owes,
        cadence: r.cadence,
        status: r.status,
      })),
      followUps: a.followUps.map((f) => ({
        id: f.id,
        item: f.item,
        waitingOn: f.waitingOn,
        nextAction: f.nextAction,
        status: f.status,
        priority: f.priority,
        lastTouched: dateOnlyISO(f.lastTouched),
        notes: f.notes.map((n) => ({ at: n.at.toISOString(), text: n.text })),
      })),
    })),
  };

  return NextResponse.json(payload);
}
