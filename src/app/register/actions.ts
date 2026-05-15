"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { users } from "@/db/schema";

export async function registerWithCredentials(
  email: string,
  password: string,
): Promise<{ ok: true } | { error: string }> {
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
  } catch {
    return { error: "Registration failed. Is DATABASE_URL set?" };
  }
}
