"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerWithCredentials } from "@/app/register/actions";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";

export function RegisterPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    router.push("/dashboard");
    router.refresh();
  }

  const inputCls = "mt-1.5 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <span className="text-4xl font-black tracking-[-0.04em] text-zinc-900 dark:text-white">
            qist
          </span>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            Create your account
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Password
              <span className="normal-case font-normal text-zinc-400 ms-1">· min 6 chars</span>
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 px-4 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition mt-2"
          >
            {loading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 dark:text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
