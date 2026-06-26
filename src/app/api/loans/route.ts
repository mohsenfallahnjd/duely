import { auth } from "@/auth";
import { requireDb } from "@/db";
import { loans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = requireDb();
  const rows = await db
    .select()
    .from(loans)
    .where(and(eq(loans.userId, session.user.id), eq(loans.active, true)))
    .orderBy(loans.dueDay);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, amount, currency, dueDay, paymentUrl } = body;
  if (!name || !amount || !dueDay) {
    return NextResponse.json({ error: "name, amount, dueDay required" }, { status: 400 });
  }
  const db = requireDb();
  const [row] = await db
    .insert(loans)
    .values({
      userId: session.user.id,
      name: String(name).trim(),
      amount: Number(amount),
      currency: String(currency || "USD"),
      dueDay: Number(dueDay),
      paymentUrl: paymentUrl ? String(paymentUrl).trim() : null,
      installments: body.installments ? Number(body.installments) : null,
      startYear: body.startYear ? Number(body.startYear) : new Date().getFullYear(),
      startMonth: body.startMonth ? Number(body.startMonth) : new Date().getMonth() + 1,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
