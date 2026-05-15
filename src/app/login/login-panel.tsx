"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/components/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { LoaderCircle } from "@/components/icons";
import { cn } from "@/lib/cn";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");

  const supabase = createBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    err === "auth"
      ? "Sign-in link expired or is invalid."
      : err === "config"
        ? "Server is missing Supabase configuration."
        : err === "oauth"
          ? "Could not complete sign-in."
          : null,
  );
  const [loading, setLoading] = useState(false);

  if (!supabase) {
    return (
      <main className="mx-auto max-w-md px-4 pb-16 pt-20 sm:pt-24">
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 text-center text-sm leading-relaxed text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            Supabase not configured
          </p>
          <p className="mt-3">
            Add{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              .env.local
            </code>{" "}
            and restart the dev server.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to PayMay
          </Link>
        </div>
      </main>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-20 sm:pt-24">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
        PayMay
      </p>
      <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        Log in
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Sync your ledger across devices with your account.
      </p>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-8 space-y-4 rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70"
      >
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        {message && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-60",
          )}
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Register
        </Link>
      </p>
      <p className="mt-3 text-center">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← Home
        </Link>
      </p>
    </main>
  );
}
