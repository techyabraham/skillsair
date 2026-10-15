import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountStep } from "@/components/apply/AccountStep";

export const metadata: Metadata = {
  title: "Secure your seat",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-16"><div className="h-80 animate-pulse rounded-2xl bg-neutral-200" /></div>}>
      <AccountStep />
    </Suspense>
  );
}
