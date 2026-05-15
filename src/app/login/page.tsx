import { Suspense } from "react";
import { LoginPanel } from "./login-panel";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPanel />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}
