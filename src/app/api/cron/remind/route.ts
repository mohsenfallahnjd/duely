import { requireDb } from "@/db";
import { loans, payments, pushSubscriptions } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL;
  if (!vapidPublic || !vapidPrivate || !vapidEmail) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const db = requireDb();
  const activeLoans = await db
    .select({ id: loans.id, name: loans.name, amount: loans.amount, currency: loans.currency, dueDay: loans.dueDay, userId: loans.userId })
    .from(loans)
    .where(eq(loans.active, true));

  const dueToday = activeLoans.filter((l) => l.dueDay === today);
  if (!dueToday.length) return NextResponse.json({ sent: 0 });

  const alreadyPaid = await db
    .select({ loanId: payments.loanId })
    .from(payments)
    .where(and(eq(payments.year, year), eq(payments.month, month), eq(payments.paid, true)));
  const paidIds = new Set(alreadyPaid.map((p) => p.loanId));
  const unpaidDue = dueToday.filter((l) => !paidIds.has(l.id));
  if (!unpaidDue.length) return NextResponse.json({ sent: 0 });

  const userIds = [...new Set(unpaidDue.map((l) => l.userId))];
  let sent = 0;

  for (const userId of userIds) {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    const userLoans = unpaidDue.filter((l) => l.userId === userId);
    const body = userLoans.length === 1
      ? `${userLoans[0].name} — ${userLoans[0].amount} ${userLoans[0].currency} due today`
      : `${userLoans.length} loan payments due today`;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "Duely — Payment Due", body }),
        );
        sent++;
      } catch { /* expired sub — ignore */ }
    }
  }
  return NextResponse.json({ sent });
}
