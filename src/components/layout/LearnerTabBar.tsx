"use client";

/**
 * Bottom tabs for learners on phones and in the installed app (wide screens have the sidebar):
 * Today · Programmes · Certificates · Profile. The lesson player and exam pages have their own
 * controls, so the bar steps aside there. It sits above the iPhone home bar.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, CalendarCheck, UserRound } from "lucide-react";
import { guidedPlanOn } from "@/content/site";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: guidedPlanOn ? "Today" : "Home", icon: CalendarCheck, match: (path: string) => path === "/dashboard" },
  { href: "/dashboard/courses", label: "Programmes", icon: BookOpen, match: (path: string) => path.startsWith("/dashboard/courses") },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award, match: (path: string) => path.startsWith("/dashboard/certificates") },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserRound,
    match: (path: string) => ["/dashboard/profile", "/dashboard/orders", "/dashboard/subscription", "/dashboard/laptop-support"].some((prefix) => path.startsWith(prefix)),
  },
];

/** Full-screen pages with their own navigation. */
export const hidesTabBar = (path: string) => /^\/dashboard\/courses\/[^/]+\/(learn|exam)(\/|$)/.test(path);

/** Room at the end of the page so the bottom tabs never cover the last thing on it. */
export function TabBarSpacer() {
  const pathname = usePathname() ?? "";
  if (hidesTabBar(pathname)) return null;
  return <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" />;
}

export function LearnerTabBar() {
  const pathname = usePathname() ?? "";
  if (hidesTabBar(pathname)) return null;
  return (
    <nav
      aria-label="Learner"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy",
                  active ? "text-navy" : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                <Icon aria-hidden="true" className="size-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
