import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** No main navigation inside the funnel: logo and a WhatsApp help link only. */
export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo variant="on-light" size="sm" />
          <WhatsAppTextLink className="text-sm">Need help?</WhatsAppTextLink>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
