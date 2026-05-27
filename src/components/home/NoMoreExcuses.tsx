"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function NoMoreExcuses() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-16 text-white md:py-24" aria-labelledby="no-more-excuses-heading">
      <motion.div
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <div className="container-wide relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">No More Excuses</p>
          <h2 id="no-more-excuses-heading" className="mx-auto mt-3 max-w-4xl text-4xl font-heading font-bold leading-tight md:text-[52px]">
            Invest in Yourself Today!
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
            Your future is worth more than hesitation. For less than the cost of a night out, you can gain skills that will change your life forever. Enroll now &mdash; your success story starts here!
          </p>
          <div className="mt-8">
            <Link href="/courses" className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-bold text-primary-800 shadow-button transition-all duration-200 hover:bg-accent hover:text-white active:scale-[0.98]">
              Start Learning Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
