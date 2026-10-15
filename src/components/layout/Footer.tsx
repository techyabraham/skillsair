import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { site, whatsappLink } from "@/content/site";

const socialIcons: Record<string, React.ReactNode> = {
  X: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  Instagram: <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />,
  Facebook: <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />,
  TikTok: <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
};

const columns: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Access Scholarship", href: "/scholarship" },
      { label: "Certificate & internships", href: "/outcomes" },
      { label: "Career Match quiz", href: "/quiz" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact us", href: "/contact" },
      { label: "Log in", href: "/login" },
      { label: "Verify a certificate", href: "/outcomes#verify" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy notice", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund policy", href: "/refunds" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "Laptop support rules", href: "/laptop-rules" },
    ],
  },
];

export function Footer({ schools = [] }: { schools?: Array<{ slug: string; name: string }> }) {
  return (
    <footer className="bg-navy text-white">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo variant="on-dark" size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">{site.promise}</p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li>
                <a href={`mailto:${site.supportEmail}`} className="hover:text-white">{site.supportEmail}</a>
              </li>
              <li>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp {site.whatsapp.display}
                </a>{" "}
                ({site.advisor.hoursShort})
              </li>
            </ul>
            <ul className="mt-6 flex items-center gap-3">
              {site.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`SkillsAir on ${link.label}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">{socialIcons[link.label]}</svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Schools</h2>
              <ul className="mt-4 space-y-2.5">
                {schools.slice(0, 10).map((school) => (
                  <li key={school.slug}>
                    <Link href={`/schools/${school.slug}`} className="text-sm text-white/75 hover:text-white">{school.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/schools" className="text-sm font-semibold text-white hover:underline">All schools</Link>
                </li>
              </ul>
            </div>
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/75 hover:text-white">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col gap-2 py-6 text-xs text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            {site.legalName} · {site.cacNumber} · {site.address}
          </p>
          <p>Payments secured by Paystack · © {new Date().getFullYear()} {site.brand}</p>
        </div>
      </div>
    </footer>
  );
}
