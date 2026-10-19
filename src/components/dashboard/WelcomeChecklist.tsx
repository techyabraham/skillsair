"use client";

import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { naira, site } from "@/content/site";
import type { EnrolledCourse } from "@/types/course";

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  });

interface Item {
  label: string;
  done: boolean;
  href?: string;
  cta?: string;
}

/** Post-payment onboarding: starts at 1 of 4 (seat secured) to build momentum. */
export function WelcomeChecklist() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useSWR<EnrolledCourse[]>(user ? `/api/students/${user.id}/courses` : null, fetcher, { revalidateOnFocus: false });
  const programmes = [...courses].sort((a, b) => (b.enrolledAt || "").localeCompare(a.enrolledAt || ""));
  const main = programmes.find((course) => !/cv|linkedin|freelanc/i.test(course.title)) ?? programmes[0];
  const bonus = programmes.find((course) => /cv|linkedin/i.test(course.title));
  const completed = Boolean(main && (main.progress >= 100 || main.completedAt));

  const items: Item[] = [
    { label: "Seat secured", done: true },
    {
      label: main ? `Watch lesson 1 of ${main.title}` : "Watch lesson 1",
      done: Boolean(main && main.progress > 0),
      href: main ? `/dashboard/courses/${main.slug}/learn` : "/dashboard/courses",
      cta: "Start learning",
    },
    {
      label: "Open your free CV & LinkedIn course",
      done: Boolean(bonus && bonus.progress > 0),
      href: bonus ? `/dashboard/courses/${bonus.slug}/learn` : "/dashboard/courses",
      cta: "Open",
    },
    { label: "Complete your profile", done: false, href: "/dashboard/profile", cta: "Update profile" },
  ];
  const doneCount = items.filter((item) => item.done).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-heading font-extrabold text-neutral-900 md:text-3xl">Welcome to SkillsAir{user?.firstName ? `, ${user.firstName}` : ""}</h1>
      <p className="mt-2 text-neutral-600">
        Your programme is designed to take about {site.programme.durationMonths} months at about {site.programme.weeklyHours} hours a week. Go at your own pace.
      </p>
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
        <p className="text-sm font-semibold text-neutral-700" aria-live="polite">
          {doneCount} of {items.length} done
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
          <div className="h-full rounded-full bg-success" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
        <ul className="mt-5 divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4 py-3">
              <span className={item.done ? "text-neutral-500 line-through" : "font-medium text-neutral-900"}>
                <span aria-hidden="true">{item.done ? "✅" : "☐"}</span> {item.label}
                <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
              </span>
              {!item.done && item.href && (
                <Link href={item.href} className="flex min-h-11 shrink-0 items-center rounded-xl bg-accent-700 px-4 text-sm font-semibold text-white hover:bg-accent-800">
                  {item.cta}
                </Link>
              )}
            </li>
          ))}
        </ul>
        {isLoading && <p className="mt-3 text-sm text-neutral-500">Loading your programmes…</p>}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <h2 className="font-heading font-semibold text-neutral-900">When you finish</h2>
        {completed && main ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Link href={`/checkout?certificate=${encodeURIComponent(main.slug)}`} className="flex min-h-12 items-center justify-center rounded-xl bg-accent-700 px-5 font-semibold text-white hover:bg-accent-800">
              Claim your certificate ({naira(site.programme.certificatePrice)})
            </Link>
            <Link href="/dashboard/laptop-support" className="flex min-h-12 items-center justify-center rounded-xl border-2 border-primary-800 px-5 font-semibold text-primary-800">
              Laptop support
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-neutral-700">
            Claim your verifiable certificate. It unlocks internship access from our partner firms, and certified graduates can apply for laptop support.
          </p>
        )}
      </div>
      <p className="mt-6 text-sm text-neutral-600">
        Questions? WhatsApp {site.advisor.name} on {site.whatsapp.display}, {site.advisor.hours}.
      </p>
    </div>
  );
}
