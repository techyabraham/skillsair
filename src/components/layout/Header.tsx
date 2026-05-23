"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isHeroPage = pathname === "/";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled || !isHeroPage
            ? "bg-white/95 backdrop-blur-md shadow-navbar"
            : "bg-transparent"
        )}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="SkillsAir home">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-hero-gradient rounded-xl flex items-center justify-center shadow-button shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span
                className={cn(
                  "text-xl font-heading font-bold tracking-tight",
                  scrolled || !isHeroPage ? "text-primary-800" : "text-white"
                )}
              >
                Skills<span className="text-accent">Air</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    pathname === link.href
                      ? "text-accent font-semibold"
                      : scrolled || !isHeroPage
                      ? "text-neutral-600 hover:text-primary-800 hover:bg-neutral-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-neutral-100 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <Avatar src={user.avatar} name={user.displayName} size="sm" />
                    <span className={cn("text-sm font-medium", scrolled || !isHeroPage ? "text-neutral-700" : "text-white")}>
                      {user.firstName}
                    </span>
                    <svg
                      className={cn("w-4 h-4 transition-transform", userMenuOpen && "rotate-180", scrolled || !isHeroPage ? "text-neutral-400" : "text-white/70")}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-modal border border-neutral-100 py-2 animate-slide-down">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">{user.displayName}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{user.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { label: "Dashboard", href: "/dashboard" },
                          { label: "My Courses", href: "/dashboard/courses" },
                          { label: "Certificates", href: "/dashboard/certificates" },
                          { label: "Profile", href: "/dashboard/profile" },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-neutral-600 hover:text-primary-800 hover:bg-neutral-50 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-neutral-100 pt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-error hover:bg-error-light transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      scrolled || !isHeroPage
                        ? "text-neutral-600 hover:text-primary-800 hover:bg-neutral-50"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button variant="accent" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={cn(
                    "block h-0.5 rounded-full transition-all duration-300 origin-center",
                    mobileOpen ? "rotate-45 translate-y-[7px] bg-neutral-900" : scrolled || !isHeroPage ? "bg-neutral-800" : "bg-white"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 rounded-full transition-all duration-300",
                    mobileOpen ? "opacity-0 scale-x-0" : scrolled || !isHeroPage ? "bg-neutral-800" : "bg-white"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 rounded-full transition-all duration-300 origin-center",
                    mobileOpen ? "-rotate-45 -translate-y-[7px] bg-neutral-900" : scrolled || !isHeroPage ? "bg-neutral-800" : "bg-white"
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-16">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="relative bg-white h-full w-full max-w-sm ml-auto overflow-y-auto shadow-modal animate-slide-down">
            <div className="p-6">
              {isAuthenticated && user && (
                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-neutral-100">
                  <Avatar src={user.avatar} name={user.displayName} size="md" />
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{user.displayName}</p>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="space-y-1" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary-50 text-primary-800 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-neutral-100 my-3 pt-3">
                      {[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "My Courses", href: "/dashboard/courses" },
                        { label: "Certificates", href: "/dashboard/certificates" },
                        { label: "Profile", href: "/dashboard/profile" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center px-4 py-3 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center px-4 py-3 rounded-xl text-sm text-error hover:bg-error-light transition-colors mt-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-neutral-100">
                    <Link href="/login" className="btn-outline text-center">Sign In</Link>
                    <Link href="/register" className="btn-accent text-center">Get Started Free</Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
