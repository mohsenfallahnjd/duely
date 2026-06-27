import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { users } from "@/db/schema";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret && process.env.NODE_ENV === "development") {
  console.warn(
    [
      "[auth] AUTH_SECRET is missing (and NEXTAUTH_SECRET).",
      "Add to .env.local:  AUTH_SECRET=$(openssl rand -base64 32)",
      "Without it, /api/auth/session returns 500 and the client will retry often.",
    ].join("\n"),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const db = requireDb();
          const email = String(credentials.email).toLowerCase().trim();
          const [row] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (!row) return null;
          const ok = await compare(
            String(credentials.password),
            row.passwordHash,
          );
          if (!ok) return null;
          return { id: row.id, email: row.email };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});
