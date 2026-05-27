"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, BookOpen, DollarSign, Users } from "lucide-react";

const FEATURES = [
  {
    title: "Job Ready Courses",
    body: "Our courses were carefully created to make you highly competitive in the job market. Courses that help you sell yourself effectively are free.",
    icon: BookOpen,
  },
  {
    title: "Economical",
    body: "We created Skills Air to ensure that low funds do not prevent you from becoming a top tech talent. Because let's face it, most Africans need this support.",
    icon: DollarSign,
  },
  {
    title: "Shareable Certificates",
    body: "Your certificate is verifiable and instantly shareable on LinkedIn and every professional platform.",
    icon: Award,
  },
  {
    title: "Community + Support",
    body: "We have a very strong community that was created to support you during and after you are done with studying your course.",
    icon: Users,
  },
];

export function WhySkillsAir() {
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="why-skillsair-heading">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Why Skills Air?</p>
          </div>
          <h2 id="why-skillsair-heading" className="mt-3 text-[28px] font-heading font-bold leading-tight text-neutral-900 md:text-4xl">
            Learning Curated For Your Success
          </h2>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className="card p-6 md:p-7"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-heading font-bold text-neutral-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{feature.body}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-10">
          <Link href="/courses" className="btn-accent">
            Start Learning
          </Link>
        </div>
      </div>
    </section>
  );
}
