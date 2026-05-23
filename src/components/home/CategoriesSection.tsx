"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Web Development", icon: "💻", count: 120, slug: "web-development", color: "from-blue-500 to-primary-800" },
  { name: "Data Science", icon: "📊", count: 85, slug: "data-science", color: "from-purple-500 to-purple-800" },
  { name: "UI/UX Design", icon: "🎨", count: 64, slug: "ui-ux-design", color: "from-pink-500 to-rose-700" },
  { name: "Business", icon: "📈", count: 73, slug: "business", color: "from-accent to-orange-700" },
  { name: "Cybersecurity", icon: "🔒", count: 48, slug: "cybersecurity", color: "from-green-500 to-emerald-700" },
  { name: "Digital Marketing", icon: "📱", count: 55, slug: "digital-marketing", color: "from-teal-500 to-cyan-700" },
  { name: "Cloud Computing", icon: "☁️", count: 42, slug: "cloud-computing", color: "from-sky-500 to-blue-700" },
  { name: "Product Management", icon: "🚀", count: 38, slug: "product-management", color: "from-yellow-500 to-amber-700" },
];

export function CategoriesSection() {
  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="categories-heading">
      <div className="container-wide">
        <div className="text-center mb-12">
          <p className="text-accent font-semibold text-sm mb-2 uppercase tracking-wide">Browse by Category</p>
          <h2 id="categories-heading" className="section-title">
            Explore Popular Topics
          </h2>
          <p className="section-subtitle mx-auto">
            From tech to business — we have courses to match every career path.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
            hidden: {},
          }}
        >
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
              }}
            >
              <Link
                href={`/courses?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:shadow-card-hover hover:border-transparent transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800 group-hover:text-primary-800 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{cat.count} courses</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-8">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-primary-800 font-semibold text-sm hover:gap-3 transition-all"
          >
            View all categories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
