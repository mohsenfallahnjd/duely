"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    err === "CredentialsSignin" ? "Invalid email or password." : err ? "Sign-in failed." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { setMessage("Invalid email or password."); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-16 pt-20">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
          <span className="text-white text-xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to Duely</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm" />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm" />
        </label>
        {message && (
          <p className="rounded-xl bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">{message}</p>
        )}
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition">
          {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Register</Link>
      </p>
    </main>
  );
}
