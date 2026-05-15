"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/icons";
import { cn } from "@/lib/cn";

export function ThemeToggle({
  className,
  variant = "toolbar",
}: {
  className?: string;
  /** "toolbar" = icon button; "segment" = light/dark text buttons */
  variant?: "toolbar" | "segment";
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const resolved = (mounted ? resolvedTheme : null) ?? theme ?? "dark";

  if (variant === "segment") {
    return (
      <div
        className={cn(
          "inline-flex rounded-full border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80",
          className,
        )}
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            resolved === "light"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            resolved === "dark"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          Dark
        </button>
      </div>
    );
  }

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
