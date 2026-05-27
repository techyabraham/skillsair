"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, GraduationCap, Trophy } from "lucide-react";

const ITEMS = [
  "High-Demand Courses, Industry-Relevant",
  "The future won't wait. Gain skills that top companies are hiring for NOW - stay ahead, get certified, and secure your dream tech job before others do!",
  "Affordable Pricing, Maximum Value",
  "Flexible Learning - Study at Your Pace",
  "Verifiable Certification - Showcase Your Skills with Proof",
  "Exclusive Job Opportunities - Get Hired Faster",
];

export function WhatYouWillGet() {
  return (
    <section className="bg-section-gradient py-16 md:py-24" aria-labelledby="what-you-get-heading">
      <div className="container-wide">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">What You Will Get</p>
            <h2 id="what-you-get-heading" className="mt-3 text-3xl font-heading font-bold text-neutral-900 md:text-5xl">
              Start Learning
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600">
              Start building the tech career you want. Our courses teach the skills companies are actually looking for, without breaking the bank. Whether you&apos;re just starting out or switching careers, we&apos;ll help you take the next step forward.
            </p>
            <div className="mt-7 space-y-3">
              {ITEMS.map((item) => (
                <div key={item} className="group flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <p className="text-sm font-medium leading-relaxed text-neutral-700 group-hover:text-neutral-900">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative rounded-[2rem] bg-hero-gradient p-6 text-white shadow-modal md:p-8"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-accent/20 blur-2xl" aria-hidden="true" />
            <div className="relative">
              <div className="grid gap-4">
                <div className="rounded-2xl bg-white p-5 text-neutral-900">
                  <GraduationCap className="h-8 w-8 text-primary-800" aria-hidden="true" />
                  <p className="mt-5 text-sm text-neutral-500">Career path readiness</p>
                  <p className="mt-1 text-3xl font-heading font-bold">92%</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <Clock3 className="h-6 w-6 text-accent" aria-hidden="true" />
                    <p className="mt-4 text-2xl font-heading font-bold">24/7</p>
                    <p className="text-xs text-white/60">Flexible access</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                    <Trophy className="h-6 w-6 text-accent" aria-hidden="true" />
                    <p className="mt-4 text-2xl font-heading font-bold">Cert</p>
                    <p className="text-xs text-white/60">Verifiable proof</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
