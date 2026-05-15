import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  applyOutboxOps,
  fetchLedgerForUser,
} from "@/lib/db/ledger-queries";
import type { OutboxOp } from "@/lib/outbox-types";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { ops?: OutboxOp[] };
    const ops = body.ops;
    if (!Array.isArray(ops) || ops.length === 0) {
      return NextResponse.json({ error: "Missing ops" }, { status: 400 });
    }
    await applyOutboxOps(session.user.id, ops);
    const data = await fetchLedgerForUser(session.user.id);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
