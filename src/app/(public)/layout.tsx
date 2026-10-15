import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/marketing/AnnouncementBar";
import { StickyMobileCTA } from "@/components/marketing/StickyMobileCTA";
import { WhatsAppFloat } from "@/components/marketing/WhatsAppButton";
import { getSchools, type SchoolSummary } from "@/lib/catalog";
import { getScholarshipWindow } from "@/lib/scholarship";
import { formatShortDate } from "@/lib/offer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [schools, scholarship] = await Promise.all([
    getSchools().catch((): SchoolSummary[] => []),
    getScholarshipWindow(),
  ]);
  const navSchools = schools.map(({ slug, name, oneLiner }) => ({ slug, name, oneLiner }));
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-modal">
        Skip to content
      </a>
      {scholarship.isOpen && scholarship.closesAt && <AnnouncementBar closesOn={formatShortDate(scholarship.closesAt)} closesAt={scholarship.closesAt} />}
      <Header schools={navSchools} />
      <main id="main">{children}</main>
      <Footer schools={navSchools} />
      <StickyMobileCTA />
      <WhatsAppFloat />
    </>
  );
}
