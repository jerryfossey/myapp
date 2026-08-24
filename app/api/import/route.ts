import { NextRequest, NextResponse } from "next/server";
import { checkImportSecret } from "@/lib/auth";
import { importPayloadSchema } from "@/lib/importSchema";
import { runImport } from "@/lib/importUpsert";

export async function POST(req: NextRequest) {
  const authorized = await checkImportSecret(req.headers.get("authorization"));
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
