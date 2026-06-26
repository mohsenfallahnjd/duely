"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithCredentials } from "@/app/register/actions";
import { LoaderCircle } from "lucide-react";

export function RegisterPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await registerWithCredentials(email, password);
    if ("error" in result) { setError(result.error); setLoading(false); return; }
    const signInResult = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInResult?.error) { setError("Account created but sign-in failed. Try logging in."); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-16 pt-20">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mb-4">
          <span className="text-white dark:text-zinc-900 text-xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">Get started with Duely</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-900 dark:border-white transition text-sm" />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password <span className="text-zinc-400 font-normal">(min 6 chars)</span>
          <input type="password" required autoComplete="new-password" minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-900 dark:border-white transition text-sm" />
        </label>
        {error && (
          <p className="rounded-xl bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>
        )}
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-60 transition">
          {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 dark:text-white  hover:underline">Sign in</Link>
      </p>
    </main>
  );
}
