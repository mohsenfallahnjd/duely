import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateEntryProgress, deleteEntry } from "@/lib/db/ledger-queries";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as { progressAmount?: number };
    if (body.progressAmount == null) {
      return NextResponse.json({ error: "Missing progressAmount" }, { status: 400 });
    }
    await updateEntryProgress(session.user.id, id, body.progressAmount);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await deleteEntry(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
