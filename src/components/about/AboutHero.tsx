"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const PILLS = ["High Quality Courses", "Flexible Learning", "Community + Support"];

export function AboutHero() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-hero-gradient pb-16 pt-28 text-white md:pb-24 md:pt-36" aria-labelledby="about-hero-heading">
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <div className="h-full w-full bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:40px_40px]" />
      </div>
      <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-primary-300/20 blur-3xl" aria-hidden="true" />

      <div className="container-wide relative">
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">About SkillsAir</p>
          <h1 id="about-hero-heading" className="mt-4 text-4xl font-heading font-bold leading-tight md:text-6xl">
            We Provide Job Ready Courses At Pocket Friendly Rates
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
            As demands for quality tech talents rise, more vacuums are created because quality tech skills are expensive to acquire. This is where we come in. We provide high quality courses at a cost that is affordable to the average African.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {PILLS.map((pill) => (
              <span key={pill} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                {pill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
