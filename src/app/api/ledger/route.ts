import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchLedgerForUser } from "@/lib/db/ledger-queries";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await fetchLedgerForUser(session.user.id);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load ledger" }, { status: 500 });
  }
}
