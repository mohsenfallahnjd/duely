"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { users } from "@/db/schema";

const DB_SETUP_HINT =
  "Add DATABASE_URL to .env.local (your Postgres URL, e.g. from Neon), restart the dev server, then run: bun run db:push";

export async function registerWithCredentials(
  email: string,
  password: string,
): Promise<{ ok: true } | { error: string }> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { error: `Database is not configured. ${DB_SETUP_HINT}` };
  }

  try {
    const db = requireDb();
    const e = email.toLowerCase().trim();
    if (!e || password.length < 6) {
      return { error: "Invalid email or password (min 6 characters)." };
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, e))
      .limit(1);
    if (existing) return { error: "An account with this email already exists." };
    const passwordHash = await hash(password, 12);
    await db.insert(users).values({ email: e, passwordHash });
    return { ok: true };
  } catch (err) {
    console.error("[register]", err);
    const hint =
      "If the database is new, run `bun run db:push`. Check DATABASE_URL and that the server can reach Postgres.";
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      return { error: `${err.message} — ${hint}` };
    }
    return { error: `Registration failed. ${hint}` };
  }
}
