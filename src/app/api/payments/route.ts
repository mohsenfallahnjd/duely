import { auth } from "@/auth";
import { requireDb } from "@/db";
import { loans, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const db = requireDb();
  const userLoans = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.userId, session.user.id), eq(loans.active, true)));
  const loanIds = userLoans.map((l) => l.id);
  if (!loanIds.length) return NextResponse.json([]);
  const rows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.year, year), eq(payments.month, month)));
  return NextResponse.json(rows.filter((r) => loanIds.includes(r.loanId)));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { loanId, year, month, paid } = await req.json();
  if (!loanId || !year || !month) {
    return NextResponse.json({ error: "loanId, year, month required" }, { status: 400 });
  }
  const db = requireDb();
  const [loan] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.id, loanId), eq(loans.userId, session.user.id)))
    .limit(1);
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.loanId, loanId), eq(payments.year, year), eq(payments.month, month)))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(payments)
      .set({ paid: Boolean(paid), paidAt: paid ? new Date() : null })
      .where(eq(payments.id, existing.id))
      .returning();
    return NextResponse.json(row);
  }

  const [row] = await db
    .insert(payments)
    .values({ loanId, year, month, paid: Boolean(paid), paidAt: paid ? new Date() : null })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
