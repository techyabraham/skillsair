"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import type { Variants } from "framer-motion";

const fadeUp = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  },
});

export function NoMoreExcuses() {
  return (
    <section
      className="relative overflow-hidden py-[80px] md:py-[120px]"
      style={{
        background:
          "linear-gradient(135deg, #0d1b4b 0%, #1e3a8a 45%, #1d4ed8 75%, #2563eb 100%)",
      }}
      aria-labelledby="no-more-excuses-heading"
    >
      {/* Animated orbs */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        aria-hidden="true"
      />

      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      <div className="container-wide relative text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Label */}
          <motion.p
            variants={fadeUp(0)}
            className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-accent"
          >
            No More Excuses
          </motion.p>

          {/* Main headline */}
          <motion.h2
            id="no-more-excuses-heading"
            variants={fadeUp(0.08)}
            className="mx-auto max-w-4xl text-[40px] font-heading font-black leading-[1.05] tracking-[-0.02em] text-white md:text-[64px]"
          >
            Invest in Yourself Today!
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp(0.18)}
            className="mx-auto mt-5 max-w-[640px] text-base leading-[1.7] text-white/75 md:text-lg"
          >
            Your future is worth more than hesitation. For less than the cost of a
            night out, you can gain skills that will change your life forever. Enroll
            now&nbsp;&mdash;&nbsp;your success story starts here!
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={fadeUp(0.28)}
            className="mt-10"
          >
            <Link
              href="/courses"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-10 py-[18px] text-sm font-bold text-primary-800 shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-accent hover:text-white hover:shadow-[0_16px_48px_rgba(249,115,22,0.45)] active:scale-[0.98]"
            >
              Start Learning Now
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
