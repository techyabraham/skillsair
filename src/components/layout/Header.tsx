"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppTextLink } from "@/components/marketing/WhatsAppButton";

export interface HeaderSchool {
  slug: string;
  name: string;
  oneLiner: string;
}

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Scholarship", href: "/scholarship" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

const ACCOUNT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Courses", href: "/dashboard/courses" },
  { label: "Certificates", href: "/dashboard/certificates" },
  { label: "Profile", href: "/dashboard/profile" },
];

interface HeaderProps {
  schools?: HeaderSchool[];
  /** Checkout and payment pages: logo and a WhatsApp help link only (no distractions). */
  minimal?: boolean;
}

export function Header({ schools = [], minimal = false }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const schoolsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setSchoolsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (schoolsRef.current && !schoolsRef.current.contains(event.target as Node)) setSchoolsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSchoolsOpen(false);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (minimal) {
    return (
      <header className="sticky inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo variant="on-light" size="sm" />
          <WhatsAppTextLink className="text-sm">Need help?</WhatsAppTextLink>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="container-wide">
          <div className="flex min-h-16 items-center justify-between gap-6 md:min-h-[72px]">
            <Logo variant="on-light" size="md" />

            <nav className="hidden items-center gap-4 lg:flex xl:gap-5" aria-label="Main navigation">
              <div className="relative" ref={schoolsRef}>
                <button
                  type="button"
                  onClick={() => setSchoolsOpen((open) => !open)}
                  aria-expanded={schoolsOpen}
                  aria-controls="schools-menu"
                  className={cn(
                    "flex min-h-11 items-center gap-1 rounded-lg px-2 text-[15px] font-medium text-neutral-900 hover:text-primary-800",
                    pathname.startsWith("/schools") && "text-primary-800",
                  )}
                >
                  Schools
                  <svg className={cn("h-4 w-4 transition-transform", schoolsOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {schoolsOpen && (
                  <div id="schools-menu" className="absolute left-0 top-full mt-2 w-[min(42rem,90vw)] rounded-2xl border border-neutral-200 bg-white p-4 shadow-modal">
                    <ul className="grid grid-cols-2 gap-1">
                      {schools.map((school) => (
                        <li key={school.slug}>
                          <Link href={`/schools/${school.slug}`} className="block rounded-xl p-3 hover:bg-neutral-50">
                            <span className="block text-sm font-semibold text-neutral-900">{school.name}</span>
                            {school.oneLiner && <span className="mt-0.5 block text-xs text-neutral-600">{school.oneLiner}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/schools" className="mt-3 block rounded-xl bg-neutral-50 p-3 text-sm font-semibold text-primary-800">
                      See all schools →
                    </Link>
                  </div>
                )}
              </div>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-2 text-[15px] font-medium text-neutral-900 hover:text-primary-800",
                    pathname === link.href && "text-primary-800",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 lg:gap-5">
              {isAuthenticated && user ? (
                <div className="relative hidden lg:block" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="flex min-h-11 items-center gap-2 rounded-xl p-1.5 pr-3 hover:bg-neutral-100"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <Avatar src={user.avatar} name={user.displayName} size="sm" />
                    <span className="text-sm font-medium text-neutral-700">{user.firstName}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-neutral-100 bg-white py-2 shadow-modal">
                      {ACCOUNT_LINKS.map((item) => (
                        <Link key={item.href} href={item.href} className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50">
                          {item.label}
                        </Link>
                      ))}
                      <button type="button" onClick={logout} className="block w-full px-4 py-2.5 text-left text-sm text-error-dark hover:bg-error-light">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden min-h-11 items-center px-2 text-[15px] font-medium text-neutral-900 hover:text-primary-800 lg:flex">
                  Log in
                </Link>
              )}
              <Link href="/apply" className="flex min-h-11 items-center rounded-xl bg-accent-700 px-4 text-[15px] font-semibold text-white hover:bg-accent-800 md:px-5">
                <span className="lg:hidden">Apply</span>
                <span className="hidden lg:inline">Apply now</span>
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-800 hover:bg-neutral-100 lg:hidden"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-30 pt-16 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-white p-6 shadow-modal" aria-label="Mobile navigation">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Schools</p>
            <ul className="mt-2 space-y-1">
              {schools.map((school) => (
                <li key={school.slug}>
                  <Link href={`/schools/${school.slug}`} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                    {school.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/schools" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary-800">
                  All schools →
                </Link>
              </li>
            </ul>
            <ul className="mt-4 space-y-1 border-t border-neutral-100 pt-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                  Contact
                </Link>
              </li>
            </ul>
            <div className="mt-4 space-y-1 border-t border-neutral-100 pt-4">
              {isAuthenticated ? (
                <>
                  {ACCOUNT_LINKS.map((item) => (
                    <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm text-neutral-700 hover:bg-neutral-50">
                      {item.label}
                    </Link>
                  ))}
                  <button type="button" onClick={logout} className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm text-error-dark hover:bg-error-light">
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                  Log in
                </Link>
              )}
            </div>
            <Link href="/apply" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-accent-700 font-semibold text-white hover:bg-accent-800">
              Apply for a scholarship seat →
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
