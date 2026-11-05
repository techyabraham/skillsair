import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { RetryButton } from "@/components/pwa/RetryButton";

export const metadata: Metadata = { title: "You're offline", robots: { index: false, follow: false } };

/** Shown by the service worker (public/sw.js) when a page can't load without a connection. Kept on the phone, so it must not need sign-in or data. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Logo linked={false} />
      <div className="max-w-sm">
        <h1 className="text-2xl font-bold text-navy">You&apos;re offline</h1>
        <p className="mt-2 text-neutral-600">Reconnect to keep learning. Your progress is saved, and you&apos;ll pick up where you stopped.</p>
      </div>
      <RetryButton />
    </main>
  );
}
