"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, DollarSign, Award, Users } from "lucide-react";

interface FeatureCard {
  title: string;
  body: string;
  icon: React.ElementType;
  accentFrom: string;
  accentTo: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: "Job Ready Courses",
    body: "Our courses were carefully created to make you highly competitive in the job market. Courses that help you sell yourself effectively are free.",
    icon: BookOpen,
    accentFrom: "#1e3a8a",
    accentTo: "#2563eb",
  },
  {
    title: "Economical",
    body: "We created Skills Air to ensure that low funds do not prevent you from becoming a top tech talent. Because let's face it, most Africans need this support.",
    icon: DollarSign,
    accentFrom: "#f97316",
    accentTo: "#ea580c",
  },
  {
    title: "Shareable Certificates",
    body: "Your certificate is verifiable and instantly shareable on LinkedIn and every professional platform.",
    icon: Award,
    accentFrom: "#7c3aed",
    accentTo: "#6d28d9",
  },
  {
    title: "Community + Support",
    body: "We have a very strong community that was created to support you during and after you are done with studying your course.",
    icon: Users,
    accentFrom: "#0891b2",
    accentTo: "#0e7490",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" as const } },
};

export function WhySkillsAir() {
  return (
    <section
      className="bg-white py-16 md:py-24"
      aria-labelledby="why-skillsair-heading"
    >
      <div className="container-wide">

        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-accent">
              Why Skills Air?
            </p>
            <span className="h-px w-8 bg-accent" aria-hidden="true" />
          </div>
          <h2
            id="why-skillsair-heading"
            className="text-[28px] font-heading font-bold text-neutral-900 md:text-[40px]"
          >
            Learning Curated For Your Success
          </h2>
        </motion.div>

        {/* 2×2 grid */}
        <motion.div
          className="grid gap-5 sm:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Top accent bar */}
                <div
                  className="h-[4px] w-full"
                  style={{
                    background: `linear-gradient(90deg, ${feature.accentFrom}, ${feature.accentTo})`,
                  }}
                  aria-hidden="true"
                />

                <div className="p-6 md:p-7">
                  {/* Icon */}
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${feature.accentFrom}, ${feature.accentTo})`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-[17px] font-heading font-bold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.75] text-neutral-500">
                    {feature.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <div className="mt-11 text-center">
          <Link href="/courses" className="btn-primary">
            Start Learning
          </Link>
        </div>
      </div>
    </section>
  );
}
