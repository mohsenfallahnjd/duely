import { auth } from "@/auth";
import { requireDb } from "@/db";
import { loans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = requireDb();
  await db
    .update(loans)
    .set({ active: false })
    .where(and(eq(loans.id, id), eq(loans.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = requireDb();
  const [row] = await db
    .update(loans)
    .set({
      name: body.name ? String(body.name).trim() : undefined,
      amount: body.amount ? Number(body.amount) : undefined,
      currency: body.currency ? String(body.currency) : undefined,
      dueDay: body.dueDay ? Number(body.dueDay) : undefined,
      paymentUrl: body.paymentUrl !== undefined ? (body.paymentUrl ? String(body.paymentUrl).trim() : null) : undefined,
      installments: body.installments !== undefined ? (body.installments ? Number(body.installments) : null) : undefined,
    })
    .where(and(eq(loans.id, id), eq(loans.userId, session.user.id)))
    .returning();
  return NextResponse.json(row);
}
