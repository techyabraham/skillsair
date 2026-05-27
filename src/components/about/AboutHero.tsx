"use client";

import { motion } from "framer-motion";
import { Check, Users, BookOpen, Star } from "lucide-react";

const PILLS = [
  "High Quality Courses",
  "Flexible Learning",
  "Community + Support",
];

const STAT_CARDS = [
  { value: "1K+", label: "Students Enrolled", icon: Users },
  { value: "500+", label: "Lessons Available", icon: BookOpen },
  { value: "4.9", label: "Average Rating", icon: Star },
];

export function AboutHero() {
  return (
    <section
      className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36"
      style={{
        background:
          "linear-gradient(135deg, #0d1b4b 0%, #1e3a8a 50%, #1d4ed8 100%)",
      }}
      aria-labelledby="about-hero-heading"
    >
      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      {/* Glow orbs */}
      <div
        className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-wide relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">

          {/* LEFT — content */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Breadcrumb label */}
            <div className="mb-5 flex items-center gap-2">
              <span className="h-px w-6 bg-accent" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                About SkillsAir
              </p>
            </div>

            <h1
              id="about-hero-heading"
              className="max-w-[560px] text-[34px] font-heading font-black leading-[1.13] text-white md:text-[52px]"
            >
              We Provide Job Ready Courses At Pocket Friendly Rates
            </h1>

            <p className="mt-5 max-w-[520px] text-base leading-[1.75] text-white/70 md:text-lg">
              As demands for quality tech talents rise, more vacuums are created
              because quality tech skills are expensive to acquire. This is where
              we come in. We provide high quality courses at a cost that is
              affordable to the average African.
            </p>

            {/* Feature pills */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              {PILLS.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-[13px] font-semibold text-white/90 backdrop-blur-sm"
                >
                  <Check
                    className="h-3.5 w-3.5 text-accent"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — decorative stats panel */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
            aria-hidden="true"
          >
            <div className="relative mx-auto max-w-[340px]">
              {/* Main card */}
              <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-7 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/8 to-transparent pointer-events-none" />
                <div className="relative">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/80">
                      Platform at a glance
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-semibold text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Live
                    </span>
                  </div>

                  {/* Stat rows */}
                  {STAT_CARDS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="mb-4 flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3 last:mb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                            <Icon className="h-4 w-4 text-accent" />
                          </div>
                          <p className="text-xs text-white/60">{s.label}</p>
                        </div>
                        <p className="text-base font-heading font-bold text-white">
                          {s.value}
                        </p>
                      </div>
                    );
                  })}

                  {/* Quote */}
                  <div className="mt-5 rounded-xl bg-accent/15 p-4">
                    <p className="text-xs leading-relaxed text-white/80 italic">
                      &ldquo;Empowering Africans to own their stake in the
                      global tech economy.&rdquo;
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-accent">
                      — SkillsAir Mission
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -right-5 -top-5 rounded-2xl border border-white/15 bg-primary-900/80 px-4 py-2.5 backdrop-blur-md shadow-lg">
                <p className="text-[11px] text-white/60">Founded</p>
                <p className="text-base font-heading font-bold text-white">Nigeria 🇳🇬</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Wave transition */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg
          viewBox="0 0 1440 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="h-10 w-full md:h-14"
        >
          <path
            d="M0 56L1440 56L1440 14C1200 50 960 0 720 28C480 56 240 8 0 36L0 56Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
