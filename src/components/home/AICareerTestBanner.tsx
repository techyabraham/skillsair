"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, BarChart2, Compass, Layers } from "lucide-react";

const FEATURE_PILLS = [
  { icon: BarChart2, label: "Strengths Analysis" },
  { icon: Compass, label: "Career Direction" },
  { icon: Layers, label: "Skill Mapping" },
  { icon: Zap, label: "Instant Results" },
];

export function AICareerTestBanner() {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      style={{
        background:
          "linear-gradient(135deg, #ea580c 0%, #c2410c 30%, #1e3a8a 70%, #0d1b4b 100%)",
      }}
      aria-labelledby="ai-career-test-heading"
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Glow orbs */}
      <div
        className="absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 h-80 w-80 -translate-y-1/4 translate-x-1/4 rounded-full bg-primary-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-wide relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">

          {/* LEFT — content */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Pulsing badge */}
            <div className="mb-6 inline-flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                Free AI-Powered Career Test
              </span>
            </div>

            <h2
              id="ai-career-test-heading"
              className="max-w-2xl text-[30px] font-heading font-bold leading-[1.15] text-white md:text-[46px]"
            >
              Not Sure Where to Start<br className="hidden sm:block" /> Your Tech Career?
            </h2>

            <p className="mt-5 max-w-[540px] text-base leading-[1.75] text-white/80 md:text-lg">
              This AI-powered personality test analyzes your strengths, interests,
              and natural abilities to recommend the tech career path that fits you
              best&nbsp;&mdash; so you can start with clarity, confidence, and
              direction.
            </p>

            {/* Feature pills */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              {FEATURE_PILLS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-9">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary-800 shadow-lg transition-all duration-200 hover:bg-accent hover:text-white hover:shadow-button-accent active:scale-[0.98]"
              >
                Take Tech Career Quiz Now
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
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* RIGHT — decorative visual */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
            aria-hidden="true"
          >
            <div className="relative w-full max-w-[360px]">
              {/* Main card */}
              <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.08] p-7 backdrop-blur-md shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent" />
                <div className="relative">
                  {/* Top: icon row */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                      <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/60">AI Analysis</p>
                      <p className="text-sm font-bold text-white">Your Career Match</p>
                    </div>
                  </div>

                  {/* Match bars */}
                  {[
                    { role: "Frontend Developer", pct: 94 },
                    { role: "Data Analyst", pct: 81 },
                    { role: "Cloud Engineer", pct: 73 },
                    { role: "UI/UX Designer", pct: 67 },
                  ].map((item) => (
                    <div key={item.role} className="mb-3 last:mb-0">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-white/70">{item.role}</span>
                        <span className="text-xs font-bold text-accent">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-400"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="mt-5 rounded-xl bg-accent/20 p-3 text-center">
                    <p className="text-xs font-semibold text-white">
                      ✦ Top match: <span className="text-accent">Frontend Developer</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md shadow-lg">
                <p className="text-[11px] font-bold text-white/80">Takes only</p>
                <p className="text-lg font-heading font-extrabold text-white">3 mins</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
