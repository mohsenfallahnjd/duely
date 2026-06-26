import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requireDb } from "@/db";
import { loans, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const db = requireDb();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const userLoans = await db
    .select()
    .from(loans)
    .where(and(eq(loans.userId, userId), eq(loans.active, true)))
    .orderBy(loans.dueDay);

  const monthPayments = userLoans.length
    ? await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.year, year),
            eq(payments.month, month),
          ),
        )
    : [];

  const loansWithPayments = userLoans.map((loan) => ({
    ...loan,
    payment: monthPayments.find((p) => p.loanId === loan.id) ?? null,
  }));

  return <Dashboard loans={loansWithPayments} currentYear={year} currentMonth={month} />;
}
