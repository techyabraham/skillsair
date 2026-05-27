"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";

export function AICareerTestBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent-50 via-white to-primary-50 py-16 md:py-24" aria-labelledby="ai-career-test-heading">
      <div className="absolute -right-24 top-10 hidden h-72 w-72 rounded-full bg-accent/20 blur-3xl lg:block" aria-hidden="true" />
      <div className="absolute right-24 bottom-8 hidden h-40 w-40 rounded-full bg-primary-600/10 blur-2xl lg:block" aria-hidden="true" />
      <div className="container-wide relative">
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="inline-flex items-center rounded-full bg-accent-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-700">
              Free AI-Powered Career Test
            </span>
            <h2 id="ai-career-test-heading" className="mt-5 max-w-3xl text-[32px] font-heading font-bold leading-tight text-neutral-900 md:text-5xl">
              Not Sure Where to Start Your Tech Career?
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
              This AI-powered personality test analyzes your strengths, interests, and natural abilities to recommend the tech career path that fits you best &mdash; so you can start with clarity, confidence, and direction.
            </p>
            <div className="mt-8">
              <Link href="/courses" className="btn-primary">
                Take Tech Career Quiz Now
              </Link>
            </div>
          </div>

          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            aria-hidden="true"
          >
            <div className="relative mx-auto aspect-square max-w-md rounded-[2rem] bg-hero-gradient p-8 text-white shadow-modal">
              <div className="absolute right-8 top-8 h-20 w-20 rounded-3xl bg-white/10" />
              <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-accent/25 blur-xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-accent">
                  <BrainCircuit className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/60">AI path recommendation</p>
                  <h3 className="mt-2 text-3xl font-heading font-bold">Clarity before commitment</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Strengths", "Interests", "Fit", "Direction"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <Sparkles className="mb-2 h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
