import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { site, whatsappLink } from "@/content/site";

const columns: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Schools",
    links: [
      { label: "All schools", href: "/schools" },
      { label: "Career Match quiz", href: "/quiz" },
      { label: "Scholarship", href: "/scholarship" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Outcomes", href: "/outcomes" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
      { label: "Cookies", href: "/cookies" },
      { label: "Laptop rules", href: "/laptop-rules" },
    ],
  },
];

/** Design: navy footer, brand block spanning two columns, three link columns, legal line. */
export function Footer() {
  return (
    <footer className="bg-navy text-sm text-neutral-300">
      <div className="container-wide flex flex-col gap-10 pb-10 pt-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 flex min-w-0 flex-col gap-3">
            <Logo variant="on-dark" size="md" />
            <p className="max-w-[360px]">{site.promise}</p>
            <p>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
                WhatsApp {site.whatsapp.display}
              </a>{" "}
              ({site.advisor.hoursShort})
              <br />
              <a href={`mailto:${site.supportEmail}`} className="text-neutral-300 hover:text-white">
                {site.supportEmail}
              </a>
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <h2 className="text-sm font-bold text-white">{column.title}</h2>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="text-neutral-300 underline-offset-4 hover:text-white hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-primary-800 pt-6 text-[13px]">
          <span>
            {site.legalName} · {site.cacNumber} · Payments secured by Paystack
          </span>
          <span className="flex flex-wrap items-center gap-x-1">
            {site.social.map((link, index) => (
              <React.Fragment key={link.label}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-white">
                  {link.label}
                </a>
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
