import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertEntry } from "@/lib/db/ledger-queries";
import type { EntryKind } from "@/lib/types";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      kind?: EntryKind;
      title?: string;
      amount?: number;
      progressAmount?: number;
      contactId?: string | null;
      tags?: string[];
      dateIso?: string;
      note?: string;
    };
    if (
      !body.kind ||
      body.amount == null ||
      body.progressAmount == null ||
      !body.dateIso
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const row = await insertEntry(session.user.id, {
      kind: body.kind,
      title: body.title?.trim() || "Untitled",
      amount: body.amount,
      progressAmount: body.progressAmount,
      contactId: body.contactId ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      dateIso: body.dateIso,
      note: body.note?.trim() ?? "",
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
  }
}
