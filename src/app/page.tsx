import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireDb } from "@/db";
import { loans, payments } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const userId = session.user.id;
	const db = requireDb();

	const userLoans = await db
		.select()
		.from(loans)
		.where(and(eq(loans.userId, userId), eq(loans.active, true)))
		.orderBy(loans.dueDay);

	const loanIds = userLoans.map((l) => l.id);
	const allPayments = loanIds.length
		? await db.select().from(payments).where(inArray(payments.loanId, loanIds))
		: [];

	return <Dashboard loans={userLoans} allPayments={allPayments} />;
}
