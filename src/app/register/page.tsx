import { Suspense } from "react";
import { RegisterPanel } from "./register-panel";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPanel />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}
