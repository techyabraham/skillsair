"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  ShieldAlert,
  Cloud,
  Code2,
  Palette,
  Video,
  BarChart3,
  TrendingUp,
  Briefcase,
  Terminal,
  Smartphone,
  BrainCircuit,
  Network,
  Globe,
  Camera,
  Megaphone,
  BookOpen,
  Cpu,
  Database,
  Lock,
  PenTool,
  Clapperboard,
  LineChart,
} from "lucide-react";
import type { CourseCategory } from "@/types/course";

// ── Icon catalogue ──────────────────────────────────────────────────────────
// Each entry has an icon component and a gradient pair (Tailwind color names).
// Keywords are matched case-insensitively against the category name/slug.
const ICON_MAP: Array<{
  keywords: string[];
  icon: React.ElementType;
  from: string;
  to: string;
}> = [
  {
    keywords: ["cyber", "security", "hacking", "ethical"],
    icon: ShieldAlert,
    from: "#dc2626",
    to: "#991b1b",
  },
  {
    keywords: ["cloud", "aws", "azure", "devops", "infrastructure"],
    icon: Cloud,
    from: "#0ea5e9",
    to: "#0369a1",
  },
  {
    keywords: ["web", "full stack", "fullstack", "frontend", "backend", "html", "css", "react", "node"],
    icon: Globe,
    from: "#2563eb",
    to: "#1e40af",
  },
  {
    keywords: ["ui", "ux", "design", "figma", "product design"],
    icon: Palette,
    from: "#7c3aed",
    to: "#5b21b6",
  },
  {
    keywords: ["video", "videography", "film", "smartphone", "mobile video"],
    icon: Clapperboard,
    from: "#db2777",
    to: "#9d174d",
  },
  {
    keywords: ["data science", "machine learning", "ai", "artificial", "deep learning"],
    icon: BrainCircuit,
    from: "#7c3aed",
    to: "#4c1d95",
  },
  {
    keywords: ["data", "analytics", "analysis", "excel", "spreadsheet"],
    icon: BarChart3,
    from: "#0891b2",
    to: "#0e7490",
  },
  {
    keywords: ["digital marketing", "marketing", "seo", "social media", "content"],
    icon: Megaphone,
    from: "#16a34a",
    to: "#14532d",
  },
  {
    keywords: ["business", "management", "entrepreneur", "finance", "accounting"],
    icon: Briefcase,
    from: "#d97706",
    to: "#92400e",
  },
  {
    keywords: ["programming", "python", "java", "software", "algorithm", "coding"],
    icon: Terminal,
    from: "#4f46e5",
    to: "#312e81",
  },
  {
    keywords: ["mobile", "android", "ios", "flutter", "react native", "app development"],
    icon: Smartphone,
    from: "#f97316",
    to: "#c2410c",
  },
  {
    keywords: ["network", "cisco", "ccna", "it support", "hardware"],
    icon: Network,
    from: "#0891b2",
    to: "#155e75",
  },
  {
    keywords: ["database", "sql", "mysql", "mongodb", "postgresql"],
    icon: Database,
    from: "#16a34a",
    to: "#065f46",
  },
  {
    keywords: ["photography", "photo"],
    icon: Camera,
    from: "#be185d",
    to: "#831843",
  },
  {
    keywords: ["graphic", "illustration", "adobe", "photoshop"],
    icon: PenTool,
    from: "#9333ea",
    to: "#6b21a8",
  },
  {
    keywords: ["growth", "trending", "career"],
    icon: TrendingUp,
    from: "#059669",
    to: "#064e3b",
  },
  {
    keywords: ["hardware", "embedded", "iot", "electronics"],
    icon: Cpu,
    from: "#64748b",
    to: "#1e293b",
  },
  {
    keywords: ["privacy", "compliance", "gdpr"],
    icon: Lock,
    from: "#dc2626",
    to: "#7f1d1d",
  },
  // Fallback pool — cycles through for anything unmatched
];

// Fallback icons in case nothing matched above
const FALLBACK_ICONS = [
  { icon: BookOpen, from: "#2563eb", to: "#1e3a8a" },
  { icon: Code2,    from: "#7c3aed", to: "#4c1d95" },
  { icon: LineChart, from: "#16a34a", to: "#14532d" },
  { icon: Globe,    from: "#0891b2", to: "#0e7490" },
  { icon: Briefcase, from: "#d97706", to: "#78350f" },
  { icon: Terminal, from: "#4f46e5", to: "#1e1b4b" },
  { icon: BarChart3, from: "#db2777", to: "#831843" },
  { icon: TrendingUp, from: "#f97316", to: "#7c2d12" },
];

function getIconConfig(name: string, slug: string, fallbackIndex: number) {
  const text = `${name} ${slug}`.toLowerCase();
  const match = ICON_MAP.find((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  );
  if (match) return { icon: match.icon, from: match.from, to: match.to };
  const fb = FALLBACK_ICONS[fallbackIndex % FALLBACK_ICONS.length];
  return fb;
}

// ── Fetcher ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CategoriesResponse {
  categories: CourseCategory[];
}

// ── Component ────────────────────────────────────────────────────────────────
export function CategoriesSection() {
  const { data } = useSWR<CategoriesResponse>("/api/categories", fetcher);
  const categories = data?.categories ?? [];

  return (
    <section
      className="bg-white py-16 md:py-24"
      aria-labelledby="categories-heading"
    >
      <div className="container-wide">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-accent">
            Browse by Category
          </p>
          <h2 id="categories-heading" className="section-title">
            Explore Popular Schools
          </h2>
          <p className="section-subtitle mx-auto">
            Choose and enroll into one of our schools.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.07 } },
            hidden: {},
          }}
        >
          {categories.map((cat, index) => {
            const { icon: Icon, from, to } = getIconConfig(cat.name, cat.slug, index);
            return (
              <motion.div
                key={cat.slug}
                variants={{
                  hidden: { opacity: 0, scale: 0.93 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.38, ease: "easeOut" as const },
                  },
                }}
              >
                <Link
                  href={`/courses?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-6 transition-all duration-300 hover:border-transparent hover:bg-white hover:shadow-card-hover"
                >
                  {/* Icon circle */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-neutral-800 transition-colors group-hover:text-primary-800">
                      {cat.name}
                    </p>
                    {cat.count > 0 && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {cat.count} {cat.count === 1 ? "course" : "courses"}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 transition-all hover:gap-2.5"
          >
            View all categories
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
