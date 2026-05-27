"use client";

import { motion } from "framer-motion";
import { Search, GraduationCap, Code, Trophy } from "lucide-react";

interface Step {
  number: string;
  title: string;
  body: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Choose a Course",
    body: "Don't waste time searching — our expert-curated tech courses put you on the fast track to success. Start now and secure your future!",
    icon: Search,
  },
  {
    number: "02",
    title: "Enroll & Learn",
    body: "Enroll in minutes and gain instant access to industry-leading lessons. Every second counts — start learning today and stay ahead of the competition!",
    icon: GraduationCap,
  },
  {
    number: "03",
    title: "Build & Apply",
    body: "Theory won't get you hired — real skills will. Work on hands-on projects that prove your expertise and make you job-ready from day one!",
    icon: Code,
  },
  {
    number: "04",
    title: "Get Certified & Get Jobs",
    body: "Stand out with industry-recognized certificates that employers trust. Boost your career now — your dream job is just one certification away!",
    icon: Trophy,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const stepVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function HowItWorks() {
  return (
    <section
      className="relative overflow-hidden bg-neutral-50 py-16 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="container-wide relative">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-accent">
              Get Started
            </p>
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
          </div>
          <h2
            id="how-it-works-heading"
            className="text-[28px] font-heading font-bold text-neutral-900 md:text-[40px]"
          >
            How Skills Air Works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Dashed connector — desktop only */}
          <div
            className="absolute left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] top-10 hidden border-t-2 border-dashed border-accent/30 lg:block"
            aria-hidden="true"
          />

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={stepVariants}
                  className="group relative rounded-2xl border border-neutral-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  {/* Number watermark */}
                  <span
                    className="absolute right-4 top-3 select-none text-[72px] font-heading font-black leading-none text-neutral-100 transition-colors duration-300 group-hover:text-accent/10"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>

                  {/* Icon circle */}
                  <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                    <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                  </div>

                  {/* Step number badge */}
                  <div className="relative mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-button-accent">
                    {step.number.replace("0", "")}
                  </div>

                  <h3 className="relative text-[15px] font-heading font-bold text-neutral-900 md:text-base">
                    {step.title}
                  </h3>
                  <p className="relative mt-2.5 text-sm leading-[1.7] text-neutral-500">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
