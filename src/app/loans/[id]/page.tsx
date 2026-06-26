import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireDb } from "@/db";
import { loans, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LoanDetail } from "@/components/loan-detail";

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const db = requireDb();
	const [loan] = await db.select().from(loans).where(and(eq(loans.id, id), eq(loans.userId, session.user.id)));
	if (!loan) redirect("/");

	const allPayments = await db.select().from(payments).where(eq(payments.loanId, id));

	return <LoanDetail loan={loan} allPayments={allPayments} />;
}
